/** URLs oficiales Culqi Checkout v4 */
export const CULQI_SCRIPT_3DS_URL = 'https://3ds.culqi.com';
export const CULQI_SCRIPT_CHECKOUT_URL = 'https://js.culqi.com/checkout-js';

/** API REST Culqi v2 */
export const CULQI_API_BASE_URL = 'https://api.culqi.com/v2';
export const CULQI_CHARGES_ENDPOINT = `${CULQI_API_BASE_URL}/charges`;

export const CULQI_CHARGE_API_DEFAULT = '/api/culqi/charge';

export const CULQI_DEFAULT_CURRENCY = 'PEN' as const;

/** Convierte soles a céntimos enteros (formato exigido por Culqi Checkout). */
export function toCulqiAmountCents(amountSoles: number): number {
  return Math.max(0, Math.round(amountSoles * 100));
}

export type CulqiCurrencyCode = typeof CULQI_DEFAULT_CURRENCY | 'USD';

export const CULQI_DEFAULT_PAYMENT_METHODS = {
  tarjeta: true,
  yape: true,
  billetera: false,
  bancaMovil: true,
  agente: false,
  cuotealo: false,
} as const;

export const CULQI_DEFAULT_PAYMENT_METHODS_SORT = [
  'tarjeta',
  'yape',
  'bancaMovil',
] as const;

export function getCulqiClientConfig() {
  const publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY?.trim();
  if (!publicKey) {
    throw new Error('NEXT_PUBLIC_CULQI_PUBLIC_KEY no está configurada');
  }

  return {
    publicKey,
    rsaId: process.env.NEXT_PUBLIC_CULQI_RSA_ID?.trim() || undefined,
    rsaPublicKey: process.env.NEXT_PUBLIC_CULQI_RSA_PUBLIC_KEY?.trim() || undefined,
    defaultTitle: process.env.NEXT_PUBLIC_CULQI_TITLE?.trim() || 'Pago GUOR',
    defaultOrderId: process.env.NEXT_PUBLIC_CULQI_ORDER_ID?.trim() || undefined,
  };
}

export function getCulqiSecretKey(): string {
  const secretKey = process.env.CULQI_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error('CULQI_SECRET_KEY no está configurada');
  }
  return secretKey;
}
