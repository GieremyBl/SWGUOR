/** Monto mínimo por transacción en el portal (soles) para evitar microcargos */
export const MONTO_MINIMO_PAGO_PARCIAL_SOLES = 10;

/** Código de respuesta cuando el checkout Culqi finaliza correctamente */
export const CODIGO_CHECKOUT_COMPLETADO = 'CHECKOUT_COMPLETADO';

export const MENSAJE_CHECKOUT_COMPLETADO = 'Pago procesado correctamente';

/**
 * Ruta de confirmación post-pago (relativa al portal).
 * Override: NEXT_PUBLIC_PORTAL_CHECKOUT_CONFIRM_PATH=/portal/pago/confirmacion
 */
export function getPortalCheckoutConfirmacionPath(): string {
  const path = process.env.NEXT_PUBLIC_PORTAL_CHECKOUT_CONFIRM_PATH?.trim();
  if (path) return path.startsWith('/') ? path : `/${path}`;
  return '/portal/pago/confirmacion';
}

export function buildCheckoutConfirmacionUrl(
  pedidoId: number | string,
  comprobanteId: string,
): string {
  const base = getPortalCheckoutConfirmacionPath();
  const params = new URLSearchParams({
    pedido_id: String(pedidoId),
    comprobante_id: comprobanteId,
  });
  return `${base}?${params.toString()}`;
}
