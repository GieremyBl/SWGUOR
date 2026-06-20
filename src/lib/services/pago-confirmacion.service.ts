import { prisma } from '@/lib/prisma';
import { extraerCulqiChargeIdDeNotas } from '@/lib/helpers/pago-confirmacion.helper';
import type { PagoConfirmacionResumen } from '@/lib/schemas/pago-confirmacion';

export class PagoConfirmacionError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'PagoConfirmacionError';
    this.code = code;
    this.status = status;
  }
}

export async function obtenerResumenConfirmacionPago(input: {
  pedidoId: bigint;
  comprobanteId: string;
  clienteId: bigint;
}): Promise<PagoConfirmacionResumen> {
  const comprobante = await prisma.comprobantes.findFirst({
    where: {
      id_uuid: input.comprobanteId,
      pedido_id: input.pedidoId,
      pedidos: { cliente_id: input.clienteId },
    },
    include: {
      pagos: true,
      pedidos: {
        include: {
          clientes: {
            select: { razon_social: true, ruc: true },
          },
        },
      },
    },
  });

  if (!comprobante?.pedidos) {
    throw new PagoConfirmacionError(
      'No se encontró la confirmación de pago solicitada',
      'CONFIRMACION_NO_ENCONTRADA',
      404,
    );
  }

  const pedido = comprobante.pedidos;
  const pago =
    comprobante.pagos ??
    (await prisma.pagos.findFirst({
      where: {
        pedido_id: input.pedidoId,
        estado: 'pagado',
      },
      orderBy: { fecha_pago: 'desc' },
    }));

  if (!pago) {
    throw new PagoConfirmacionError(
      'No se encontró el registro de pago asociado',
      'PAGO_NO_ENCONTRADO',
      404,
    );
  }

  const cliente = pedido.clientes;

  return {
    pedido: {
      id: Number(pedido.id),
      estado: pedido.estado,
      total: Number(pedido.total ?? 0),
      monto_pagado: Number(pedido.monto_pagado ?? 0),
      saldo_pendiente: Number(pedido.saldo_pendiente ?? 0),
      moneda: pedido.moneda ?? 'PEN',
    },
    pago: {
      id: pago.id_uuid,
      monto: Number(pago.monto ?? 0),
      metodo_pago: pago.metodo_pago,
      fecha_pago: pago.fecha_pago.toISOString(),
      estado: pago.estado,
      culqi_charge_id: extraerCulqiChargeIdDeNotas(pago.notas),
    },
    comprobante: {
      id: comprobante.id_uuid,
      tipo: comprobante.tipo,
      serie: comprobante.serie,
      correlativo: comprobante.correlativo,
      numero_completo: comprobante.numero_completo,
      subtotal: Number(comprobante.subtotal ?? 0),
      igv: Number(comprobante.igv ?? 0),
      total: Number(comprobante.total ?? 0),
      moneda: comprobante.moneda ?? 'PEN',
      estado_sunat: comprobante.estado_sunat,
      fecha_emision: comprobante.fecha_emision.toISOString(),
      pdf_url: comprobante.pdf_url,
    },
    cliente: {
      razon_social: cliente?.razon_social ?? null,
      ruc: cliente?.ruc ?? '',
    },
  };
}

export function isPagoConfirmacionError(error: unknown): error is PagoConfirmacionError {
  return error instanceof PagoConfirmacionError;
}
