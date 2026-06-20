import { MONTO_MINIMO_PAGO_PARCIAL_SOLES } from '@/lib/constants/culqi-checkout';
import type { TipoPago } from '@prisma/client';

export interface ResumenPagoPedido {
  total: number;
  montoPagado: number;
  saldoPendiente: number;
}

export function extraerResumenPagoPedido(pedido: {
  total?: number | string | null;
  monto_pagado?: number | string | null;
  saldo_pendiente?: number | string | null;
  moneda?: string
}): ResumenPagoPedido {
  const total = Number(pedido.total ?? 0);
  const montoPagado = Number(pedido.monto_pagado ?? 0);
  const saldoRegistrado = Number(pedido.saldo_pendiente ?? 0);
  const saldoPendiente =
    saldoRegistrado > 0 ? saldoRegistrado : Math.max(total - montoPagado, 0);

  return {
    total,
    montoPagado,
    saldoPendiente: Math.round(saldoPendiente * 100) / 100,
  };
}

/** Si el saldo es menor al mínimo, se permite pagar el saldo exacto (cierre del pedido). */
export function montoMinimoPermitido(saldoPendiente: number): number {
  if (saldoPendiente <= 0) return 0;
  if (saldoPendiente < MONTO_MINIMO_PAGO_PARCIAL_SOLES) return saldoPendiente;
  return MONTO_MINIMO_PAGO_PARCIAL_SOLES;
}

export function validarMontoPagoParcial(
  monto: number,
  saldoPendiente: number,
): { valido: boolean; mensaje?: string } {
  if (!Number.isFinite(monto) || monto <= 0) {
    return { valido: false, mensaje: 'Ingresa un monto válido mayor a 0' };
  }

  if (saldoPendiente <= 0) {
    return { valido: false, mensaje: 'Este pedido no tiene saldo pendiente' };
  }

  if (monto > saldoPendiente + 0.001) {
    return {
      valido: false,
      mensaje: `El monto no puede superar el saldo pendiente (S/ ${saldoPendiente.toFixed(2)})`,
    };
  }

  const minimo = montoMinimoPermitido(saldoPendiente);
  if (monto + 0.001 < minimo) {
    return {
      valido: false,
      mensaje:
        saldoPendiente < MONTO_MINIMO_PAGO_PARCIAL_SOLES
          ? `Debes pagar el saldo restante de S/ ${saldoPendiente.toFixed(2)}`
          : `El monto mínimo por pago es S/ ${MONTO_MINIMO_PAGO_PARCIAL_SOLES.toFixed(2)}`,
    };
  }

  return { valido: true };
}

export function formatearSoles(monto: number): string {
  return `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Clasifica el tipo de pago según el historial del pedido y si salda la deuda.
 */
export function resolverTipoPagoCulqi(
  montoPagadoAntes: number,
  esPagoQueSaldaDeuda: boolean,
): TipoPago {
  if (esPagoQueSaldaDeuda) {
    return montoPagadoAntes > 0 ? 'saldo_final' : 'pago_completo';
  }
  return montoPagadoAntes > 0 ? 'cuota' : 'adelanto';
}

export function calcularMontosTrasPago(
  saldoPendienteActual: number,
  montoPagadoActual: number,
  montoAPagar: number,
) {
  const monto = Math.round(montoAPagar * 100) / 100;
  const nuevoMontoPagado = Math.round((montoPagadoActual + monto) * 100) / 100;
  const nuevoSaldoPendiente = Math.max(
    Math.round((saldoPendienteActual - monto) * 100) / 100,
    0,
  );
  const esPagoQueSaldaDeuda = nuevoSaldoPendiente <= 0;

  return {
    monto,
    nuevoMontoPagado,
    nuevoSaldoPendiente,
    esPagoQueSaldaDeuda,
  };
}
