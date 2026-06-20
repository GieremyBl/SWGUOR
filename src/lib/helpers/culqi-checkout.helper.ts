import {
  CULQI_DEFAULT_CURRENCY,
  CULQI_DEFAULT_PAYMENT_METHODS,
  CULQI_DEFAULT_PAYMENT_METHODS_SORT,
  CULQI_SCRIPT_3DS_URL,
  CULQI_SCRIPT_CHECKOUT_URL,
  getCulqiClientConfig,
  type CulqiCurrencyCode,
} from '@/lib/constants/culqi';
import type { CulqiCheckoutInstance, CulqiCheckoutOptions } from '@/types/culqi';

let scriptsLoadPromise: Promise<void> | null = null;

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.body.appendChild(script);
  });
}

/** Carga dinámica de scripts oficiales Culqi Checkout v4 (3DS + checkout-js) */
export async function loadCulqiCheckoutScripts(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.CulqiCheckout) return;

  if (!scriptsLoadPromise) {
    scriptsLoadPromise = (async () => {
      await loadScriptOnce(CULQI_SCRIPT_3DS_URL);
      await loadScriptOnce(CULQI_SCRIPT_CHECKOUT_URL);
    })().catch((err) => {
      scriptsLoadPromise = null;
      throw err;
    });
  }

  await scriptsLoadPromise;
}

export interface BuildCulqiCheckoutConfigInput {
  amount: number;
  email: string;
  currency?: CulqiCurrencyCode;
  title?: string;
  orderId?: string;
  modal?: boolean;
  container?: string;
  paymentMethods?: CulqiCheckoutOptions['options']['paymentMethods'];
  paymentMethodsSort?: CulqiCheckoutOptions['options']['paymentMethodsSort'];
}

export function buildCulqiCheckoutConfig(
  input: BuildCulqiCheckoutConfigInput,
): CulqiCheckoutOptions {
  const client = getCulqiClientConfig();
  const amountCents = Math.max(0, Math.round(input.amount));

  if (amountCents <= 0) {
    throw new Error('El monto para Culqi debe ser mayor a 0 céntimos');
  }

  return {
    settings: {
      title: input.title ?? client.defaultTitle,
      currency: input.currency ?? CULQI_DEFAULT_CURRENCY,
      amount: amountCents,
      ...(input.orderId ?? client.defaultOrderId
        ? { order: input.orderId ?? client.defaultOrderId }
        : {}),
      ...(client.rsaId ? { xculqirsaid: client.rsaId } : {}),
      ...(client.rsaPublicKey ? { rsapublickey: client.rsaPublicKey } : {}),
    },
    client: { email: input.email },
    options: {
      lang: 'auto',
      installments: false,
      modal: input.modal ?? true,
      ...(input.container ? { container: input.container } : {}),
      paymentMethods: input.paymentMethods ?? { ...CULQI_DEFAULT_PAYMENT_METHODS },
      paymentMethodsSort: input.paymentMethodsSort ?? [...CULQI_DEFAULT_PAYMENT_METHODS_SORT],
    },
  };
}

export function createCulqiCheckoutInstance(
  config: CulqiCheckoutOptions,
): CulqiCheckoutInstance {
  const { publicKey } = getCulqiClientConfig();
  if (!window.CulqiCheckout) {
    throw new Error('Culqi Checkout no está disponible');
  }
  return new window.CulqiCheckout(publicKey, config);
}

export interface CulqiTokenizationResult {
  tokenId?: string;
  sourceId?: string;
  errorMessage?: string;
  errorCode?: string;
}

/** Interpreta la respuesta del callback `culqi` de Checkout v4 */
export function parseCulqiCheckoutResult(
  instance: CulqiCheckoutInstance,
): CulqiTokenizationResult {
  if (instance.token?.id) {
    return { tokenId: instance.token.id };
  }

  const raw = instance as CulqiCheckoutInstance & {
    source_id?: string;
    source?: { id?: string };
    order?: { source_id?: string };
  };

  const sourceId =
    raw.source_id ?? raw.source?.id ?? raw.order?.source_id ?? undefined;
  if (sourceId) {
    return { sourceId };
  }

  return {
    errorMessage: instance.error?.user_message || 'No se pudo tokenizar el pago',
    errorCode: instance.error?.code,
  };
}

export function mapCulqiUserMessage(message: string, code?: string): string {
  const normalized = message.trim();
  if (normalized) return normalized;

  if (code === 'insufficient_funds') {
    return 'Fondos insuficientes en la tarjeta';
  }
  if (code === 'stolen_card' || code === 'lost_card') {
    return 'Tarjeta rechazada. Contacte a su banco';
  }

  return 'No se pudo procesar el pago. Intente con otra tarjeta';
}
