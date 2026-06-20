import { EstadoPago, EstadoPedido } from '@prisma/client';
import type { DatosPagadorCheckout } from '@/lib/schemas/datos-pagador-pago';
import { appendDatosPagadorEnNotas } from '@/lib/helpers/datos-pagador-pago.helper';

/**
 * En el esquema Prisma no existe `exitoso`; el equivalente operativo es `pagado`.
 */
export const ESTADO_PAGO_CULQI_EXITOSO = EstadoPago.pagado;

/** Pedido totalmente cubierto tras el cobro Culqi */
export const ESTADO_PEDIDO_PAGO_COMPLETO = EstadoPedido.pagado;

export function buildNotasPagoCulqi(
  culqiChargeId: string,
  pagador?: DatosPagadorCheckout,
): string {
  const base = `Pago automático Culqi | charge_id=${culqiChargeId.trim()}`;
  if (!pagador) return base;
  return appendDatosPagadorEnNotas(base, pagador);
}
