import {
  EXCHANGE_RATE_CACHE_TTL_MS,
  EXCHANGE_RATE_FALLBACK_USD_PEN,
  getExchangeRateApiUrl,
} from '@/lib/constants/exchange-rate';

interface ExchangeRateCacheEntry {
  /** Cuántos PEN equivalen a 1 USD. */
  usdToPen: number;
  fetchedAt: number;
}

let exchangeRateCache: ExchangeRateCacheEntry | null = null;

interface ExchangeRateApiResponse {
  result?: string;
  conversion_rates?: Record<string, number>;
}

function parsePenRateFromResponse(payload: ExchangeRateApiResponse): number | null {
  if (payload.result !== 'success') return null;

  const penRate = payload.conversion_rates?.PEN;
  if (typeof penRate !== 'number' || !Number.isFinite(penRate) || penRate <= 0) {
    return null;
  }

  return penRate;
}

/**
 * Obtiene el tipo de cambio USD/PEN (PEN por 1 USD) con caché de 24 h en memoria.
 */
export async function getUsdToPenExchangeRate(): Promise<number> {
  const now = Date.now();

  if (
    exchangeRateCache &&
    now - exchangeRateCache.fetchedAt < EXCHANGE_RATE_CACHE_TTL_MS
  ) {
    return exchangeRateCache.usdToPen;
  }

  const apiUrl = getExchangeRateApiUrl();

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, { cache: 'no-store' });

      if (response.ok) {
        const payload = (await response.json()) as ExchangeRateApiResponse;
        const penRate = parsePenRateFromResponse(payload);

        if (penRate) {
          exchangeRateCache = { usdToPen: penRate, fetchedAt: now };
          return penRate;
        }
      }
    } catch {
      // Usar caché expirado o tasa de respaldo.
    }
  }

  if (exchangeRateCache?.usdToPen) {
    return exchangeRateCache.usdToPen;
  }

  return EXCHANGE_RATE_FALLBACK_USD_PEN;
}

/** Convierte un monto en PEN a USD usando la tasa del día (redondeo a 2 decimales). */
export async function convertPenToUsd(montoPen: number): Promise<number> {
  const rate = await getUsdToPenExchangeRate();
  const safeRate = rate > 0 ? rate : EXCHANGE_RATE_FALLBACK_USD_PEN;
  return Math.round((montoPen / safeRate) * 100) / 100;
}
