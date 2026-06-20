/** Moneda por defecto para cobros Mercado Pago en el portal GUOR */
export const MERCADOPAGO_DEFAULT_CURRENCY = 'PEN' as const;

/** Script oficial del SDK JS v2 (requerido antes de Bricks.create). */
export const MERCADOPAGO_SDK_SCRIPT_URL = 'https://sdk.mercadopago.com/js/v2';

export const MERCADOPAGO_SDK_SCRIPT_ID = 'mercadopago-sdk-v2';

export function getMercadoPagoPublicKeyEnv(): string {
  return process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim() ?? '';
}

export function getMercadoPagoAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurada');
  }
  return token;
}

export function getMercadoPagoPublicKey(): string {
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim();
  if (!publicKey) {
    throw new Error('NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no está configurada');
  }
  return publicKey;
}

export function isMercadoPagoTestMode(): boolean {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? '';
  return token.startsWith('TEST-');
}

export function buildNotasPagoMercadoPago(paymentId: string | number): string {
  return `Pago automático Mercado Pago | payment_id=${String(paymentId).trim()}`;
}
