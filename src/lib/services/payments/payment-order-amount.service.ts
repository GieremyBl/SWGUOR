import { prisma } from '@/lib/prisma';
import {
  CULQI_DEFAULT_CURRENCY,
  type CulqiCurrencyCode,
} from '@/lib/constants/culqi';
import { MONTO_MINIMO_PAGO_PARCIAL_SOLES } from '@/lib/constants/culqi-checkout';
import {
  extraerResumenPagoPedido,
  validarMontoPagoParcial,
} from '@/lib/helpers/pago-parcial.helper';
import { CulqiPedidoPagoError } from '@/lib/services/payments/payment-gateway.error';
import type { MontoCobroValidado } from '@/lib/services/payments/payment-gateway.types';
import { PedidoNoEncontradoPagoError } from '@/lib/services/pago-idempotencia.service';

function normalizeCurrency(raw?: string | null): CulqiCurrencyCode {
  const code = (raw ?? CULQI_DEFAULT_CURRENCY).toUpperCase();
  return code === 'USD' ? 'USD' : 'PEN';
}

/**
 * Resuelve y valida el monto a cobrar contra el saldo pendiente en BD.
 * Compartido por todas las pasarelas para no confiar en el frontend.
 */
export async function obtenerMontoCobroPedidoDesdeBd(
  pedidoId: bigint,
  montoSolicitado?: number,
): Promise<MontoCobroValidado> {
  const pedido = await prisma.pedidos.findUnique({
    where: { id: pedidoId },
    select: {
      total: true,
      saldo_pendiente: true,
      monto_pagado: true,
      moneda: true,
    },
  });

  if (!pedido) {
    throw new PedidoNoEncontradoPagoError();
  }

  const resumen = extraerResumenPagoPedido({
    total: pedido.total.toNumber(),
    saldo_pendiente: pedido.saldo_pendiente.toNumber(),
    monto_pagado: pedido.monto_pagado.toNumber(),
    moneda: pedido.moneda,
  });

  if (resumen.saldoPendiente <= 0) {
    throw new CulqiPedidoPagoError(
      'El pedido no tiene saldo pendiente por cobrar',
      'PEDIDO_SIN_SALDO',
      400,
    );
  }

  const amountSoles =
    montoSolicitado !== undefined && montoSolicitado > 0
      ? montoSolicitado
      : resumen.saldoPendiente;

  const validacion = validarMontoPagoParcial(amountSoles, resumen.saldoPendiente);
  if (!validacion.valido) {
    throw new CulqiPedidoPagoError(
      validacion.mensaje ?? 'Monto de pago inválido',
      amountSoles < MONTO_MINIMO_PAGO_PARCIAL_SOLES ? 'MONTO_MINIMO' : 'MONTO_EXCEDE_SALDO',
      400,
    );
  }

  return {
    amountSoles: Math.round(amountSoles * 100) / 100,
    amountCents: Math.round(amountSoles * 100),
    currencyCode: normalizeCurrency(pedido.moneda),
  };
}
