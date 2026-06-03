/** MOQ por defecto cuando el producto no define uno en catálogo o carrito legacy. */
export const MOQ_COMPRA_DEFAULT = 1;

/** Normaliza MOQ desde BD, JSON persistido o ítems legacy. */
export function resolveCartMoq(moq: unknown): number {
  const n = Number(moq);
  // Si el producto tiene moq válido en BD, úsalo; si no, permite al menos 1
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : MOQ_COMPRA_DEFAULT;
}

export const ORIGEN_COTIZACION_SOLICITUD = 'solicitud_cliente';
