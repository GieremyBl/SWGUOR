import { EstadoPago } from '@prisma/client';

export type MercadoPagoPaymentStatus =
  | 'approved'
  | 'in_process'
  | 'pending'
  | 'rejected'
  | 'cancelled'
  | string;

/**
 * Mapea el status de Mercado Pago al enum `EstadoPago` de Prisma.
 *
 * | Mercado Pago | EstadoPago BD |
 * |--------------|---------------|
 * | approved     | pagado        |
 * | in_process   | pendiente     |
 * | pending      | pendiente     |
 * | rejected     | anulado       |
 * | cancelled    | anulado       |
 */
export function mapMercadoPagoStatusAEstadoPago(
  status: MercadoPagoPaymentStatus,
): EstadoPago {
  const normalized = String(status ?? '').toLowerCase();

  switch (normalized) {
    case 'approved':
      return EstadoPago.pagado;
    case 'in_process':
    case 'pending':
      return EstadoPago.pendiente;
    case 'rejected':
    case 'cancelled':
      return EstadoPago.anulado;
    default:
      return EstadoPago.pendiente;
  }
}

export function esMercadoPagoAprobado(status: MercadoPagoPaymentStatus): boolean {
  return String(status ?? '').toLowerCase() === 'approved';
}

export function esMercadoPagoEnProceso(status: MercadoPagoPaymentStatus): boolean {
  const normalized = String(status ?? '').toLowerCase();
  return normalized === 'in_process' || normalized === 'pending';
}

export function esMercadoPagoRechazado(status: MercadoPagoPaymentStatus): boolean {
  const normalized = String(status ?? '').toLowerCase();
  return normalized === 'rejected' || normalized === 'cancelled';
}

export function mensajeMercadoPagoPorEstado(status: MercadoPagoPaymentStatus): string {
  const normalized = String(status ?? '').toLowerCase();

  switch (normalized) {
    case 'approved':
      return 'Pago aprobado por Mercado Pago';
    case 'in_process':
      return 'El pago está en proceso de validación';
    case 'pending':
      return 'El pago está pendiente de confirmación';
    case 'rejected':
      return 'El pago fue rechazado por Mercado Pago';
    case 'cancelled':
      return 'El pago fue cancelado';
    default:
      return `Estado de pago: ${normalized || 'desconocido'}`;
  }
}
