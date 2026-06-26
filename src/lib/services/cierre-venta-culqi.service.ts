import { randomUUID } from 'crypto';
import type {
  comprobantes,
  EstadoPago,
  MetodoPago,
  pagos,
  pedidos,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  buildNotasPagoCulqi,
  ESTADO_PAGO_CULQI_EXITOSO,
  ESTADO_PEDIDO_PAGO_COMPLETO,
} from '@/lib/constants/cierre-venta';
import { obtenerProximoCorrelativoSerie } from '@/lib/helpers/comprobante-correlativo.helper';
import {
  generarDatosComprobanteSimulado,
  type DatosPedidoFacturacion,
  determinarTipoComprobantePorDocumento,
  resolverSeriePorTipo,
} from '@/lib/helpers/facturacion-simulada.helper';
import {
  calcularMontosTrasPago,
  extraerResumenPagoPedido,
  resolverTipoPagoCulqi,
  validarMontoPagoParcial,
} from '@/lib/helpers/pago-parcial.helper';
import { generarYAlmacenarPdfComprobante } from '@/lib/services/comprobante-documento.service';
import {
  assertIdempotenciaPagoPedidoEnTx,
  PedidoNoEncontradoPagoError,
} from '@/lib/services/pago-idempotencia.service';
import { crearDespachoPlaceholderPagoPedido } from '@/lib/helpers/crear-despacho-pedido.helper';

export class CierreVentaCulqiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'CierreVentaCulqiError';
    this.code = code;
    this.status = status;
  }
}

export interface CierreVentaCulqiInput {
  pedidoId: number | bigint;
  monto: number;
  metodoPago: MetodoPago;
  culqiChargeId: string;
  /** Estado del registro en `pagos.estado` (por defecto: pagado) */
  estadoPago?: EstadoPago;
  /** Notas personalizadas (por defecto: referencia Culqi) */
  notas?: string;
}

export interface CierreVentaCulqiResult {
  pago: pagos;
  pedido: pedidos;
  comprobante: comprobantes;
}

type PedidoConCliente = Prisma.pedidosGetPayload<{
  include: {
    clientes: {
      select: { ruc: true; razon_social: true };
    };
  };
}>;

function resolverDatosPedidoFacturacion(
  pedido: PedidoConCliente,
  montoCobrado: number,
  esPagoTotal: boolean,
): DatosPedidoFacturacion {
  if (
    esPagoTotal &&
    pedido.subtotal != null &&
    pedido.igv != null &&
    pedido.total != null
  ) {
    return {
      id: pedido.id,
      subtotal: Number(pedido.subtotal),
      igv: Number(pedido.igv),
      total: Number(pedido.total),
      moneda: pedido.moneda,
    };
  }

  return {
    id: pedido.id,
    total: montoCobrado,
    moneda: pedido.moneda,
  };
}

/**
 * Cierre atómico post-Culqi: pago + actualización de pedido + comprobante simulado.
 * Si cualquier paso falla, Prisma revierte toda la transacción.
 */
export async function ejecutarCierreVentaPostCulqi(
  input: CierreVentaCulqiInput,
): Promise<CierreVentaCulqiResult> {
  const pedidoId = BigInt(input.pedidoId);
  const monto = Number(input.monto);
  const culqiChargeId = input.culqiChargeId?.trim();

  if (!Number.isFinite(monto) || monto <= 0) {
    throw new CierreVentaCulqiError('Monto de cobro inválido', 'MONTO_INVALIDO');
  }

  if (!culqiChargeId) {
    throw new CierreVentaCulqiError(
      'ID de transacción Culqi requerido',
      'CULQI_CHARGE_ID_REQUERIDO',
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    await assertIdempotenciaPagoPedidoEnTx(tx, pedidoId);

    const pedido = await tx.pedidos.findUnique({
      where: { id: pedidoId },
      include: {
        clientes: {
          select: { ruc: true, razon_social: true },
        },
      },
    });

    if (!pedido) {
      throw new PedidoNoEncontradoPagoError();
    }

    if (!pedido.clientes?.ruc?.trim()) {
      throw new CierreVentaCulqiError(
        'El cliente no tiene documento (RUC/DNI) para emitir comprobante',
        'CLIENTE_SIN_DOCUMENTO',
      );
    }

    const resumen = extraerResumenPagoPedido(pedido);
    const validacion = validarMontoPagoParcial(monto, resumen.saldoPendiente);
    if (!validacion.valido) {
      throw new CierreVentaCulqiError(
        validacion.mensaje ?? 'Monto de pago inválido',
        'MONTO_INVALIDO',
      );
    }

    const {
      monto: montoCobrado,
      nuevoMontoPagado,
      nuevoSaldoPendiente,
      esPagoQueSaldaDeuda,
    } = calcularMontosTrasPago(
      resumen.saldoPendiente,
      resumen.montoPagado,
      monto,
    );

    const tipoPago = resolverTipoPagoCulqi(resumen.montoPagado, esPagoQueSaldaDeuda);

    const pagoId = randomUUID();

    const pago = await tx.pagos.create({
      data: {
        id_uuid: pagoId,
        pedido_id: pedidoId,
        monto: montoCobrado,
        metodo_pago: input.metodoPago,
        tipo: tipoPago,
        estado: input.estadoPago ?? ESTADO_PAGO_CULQI_EXITOSO,
        fecha_pago: new Date(),
        notas: input.notas ?? buildNotasPagoCulqi(culqiChargeId),
      },
    });

    const pedidoActualizado = await tx.pedidos.update({
      where: { id: pedidoId },
      data: {
        metodo_pago: input.metodoPago,
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: nuevoSaldoPendiente,
        ...(esPagoQueSaldaDeuda ? { estado: ESTADO_PEDIDO_PAGO_COMPLETO } : {}),
      },
    });

    if (esPagoQueSaldaDeuda) {
      await crearDespachoPlaceholderPagoPedido(tx, {
        id: pedido.id,
        direccion_despacho: pedido.direccion_despacho,
      });
    }

    const tipoComprobante = determinarTipoComprobantePorDocumento(pedido.clientes.ruc);
    const serie = resolverSeriePorTipo(tipoComprobante);
    const correlativo = await obtenerProximoCorrelativoSerie(tx, serie);

    const comprobanteData = generarDatosComprobanteSimulado({
      pedido: resolverDatosPedidoFacturacion(pedido, montoCobrado, esPagoQueSaldaDeuda),
      cliente: {
        ruc: pedido.clientes.ruc,
        razon_social: pedido.clientes.razon_social,
      },
      pagoId,
      correlativo,
    });

    const comprobante = await tx.comprobantes.create({ data: comprobanteData });

    return {
      pago,
      pedido: pedidoActualizado,
      comprobante,
    };
  });

  try {
    await generarYAlmacenarPdfComprobante(result.comprobante.id_uuid);
  } catch (pdfErr) {
    console.error('[cierre-venta] PDF comprobante no generado:', pdfErr);
  }

  return result;
}

export function isCierreVentaCulqiError(error: unknown): error is CierreVentaCulqiError {
  return error instanceof CierreVentaCulqiError;
}
