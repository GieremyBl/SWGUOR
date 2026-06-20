/**
 * Mercado Pago usa monto en unidades mayores para PEN/USD (ej. 118.15).
 * @see https://www.mercadopago.com.pe/developers/es/docs/checkout-api/integration-configuration/integrate-with-pix
 */
export function toMercadoPagoAmount(amountMajor: number): number {
  const safe = Math.max(0, Number(amountMajor));
  if (!Number.isFinite(safe)) {
    throw new Error('Monto inválido para Mercado Pago');
  }
  return Math.round(safe * 100) / 100;
}

export function normalizeMercadoPagoCurrency(currency: string): string {
  const code = currency.trim().toUpperCase();
  return code === 'USD' ? 'USD' : 'PEN';
}
