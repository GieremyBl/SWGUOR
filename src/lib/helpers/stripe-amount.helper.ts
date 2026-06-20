/**
 * Monedas sin decimales en Stripe (amount = unidad mayor).
 * @see https://stripe.com/docs/currencies#zero-decimal
 */
const STRIPE_ZERO_DECIMAL_CURRENCIES = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);

function normalizeCurrencyCode(currency: string): string {
  return currency.trim().toLowerCase();
}

/**
 * Convierte monto en unidades mayores (ej. 118.15 PEN) al formato entero de Stripe.
 * PEN y USD usan 2 decimales → multiplicar por 100.
 */
export function toStripeAmount(amountMajor: number, currency: string): number {
  const code = normalizeCurrencyCode(currency);
  const safeAmount = Math.max(0, Number(amountMajor));

  if (!Number.isFinite(safeAmount)) {
    throw new Error('Monto inválido para Stripe');
  }

  if (STRIPE_ZERO_DECIMAL_CURRENCIES.has(code)) {
    return Math.round(safeAmount);
  }

  return Math.round(safeAmount * 100);
}

/** Convierte el amount de Stripe a unidades mayores para persistencia interna */
export function fromStripeAmount(amountMinor: number, currency: string): number {
  const code = normalizeCurrencyCode(currency);

  if (STRIPE_ZERO_DECIMAL_CURRENCIES.has(code)) {
    return amountMinor;
  }

  return Math.round(amountMinor) / 100;
}

export function toStripeCurrencyCode(currency: string): string {
  return normalizeCurrencyCode(currency);
}
