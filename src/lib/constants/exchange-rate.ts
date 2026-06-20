/** Tasa USD/PEN de respaldo cuando la API no está disponible (1 USD = X PEN). */
export const EXCHANGE_RATE_FALLBACK_USD_PEN = 3.8;

/** TTL del caché en memoria: 24 horas. */
export const EXCHANGE_RATE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function getExchangeRateApiUrl(): string | null {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY?.trim();
  if (!apiKey) return null;
  return `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
}
