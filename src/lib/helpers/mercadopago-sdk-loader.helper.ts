import {
  MERCADOPAGO_SDK_SCRIPT_ID,
  MERCADOPAGO_SDK_SCRIPT_URL,
} from '@/lib/constants/mercadopago';

const MP_SDK_READY_MAX_ATTEMPTS = 50;
const MP_SDK_READY_POLL_MS = 100;

function esperarMercadoPagoGlobal(): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const verificar = () => {
      if (typeof window !== 'undefined' && window.MercadoPago) {
        resolve();
        return;
      }

      attempts += 1;
      if (attempts >= MP_SDK_READY_MAX_ATTEMPTS) {
        reject(
          new Error(
            'El script de Mercado Pago se cargó pero window.MercadoPago no está disponible',
          ),
        );
        return;
      }

      window.setTimeout(verificar, MP_SDK_READY_POLL_MS);
    };

    verificar();
  });
}

function enlazarCargaScript(script: HTMLScriptElement): Promise<void> {
  return new Promise((resolve, reject) => {
    script.addEventListener('load', () => {
      void esperarMercadoPagoGlobal().then(resolve).catch(reject);
    });
    script.addEventListener('error', () => {
      reject(new Error('No se pudo cargar el script de Mercado Pago'));
    });
  });
}

/**
 * Carga dinámicamente el SDK JS v2 si aún no está en el DOM.
 * Resuelve cuando window.MercadoPago está disponible.
 */
export async function loadMercadoPagoSdkScript(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Mercado Pago SDK solo puede cargarse en el cliente');
  }

  if (window.MercadoPago) {
    return;
  }

  const scriptExistente = document.getElementById(
    MERCADOPAGO_SDK_SCRIPT_ID,
  ) as HTMLScriptElement | null;

  if (scriptExistente) {
    if (window.MercadoPago) return;
    await enlazarCargaScript(scriptExistente);
    return;
  }

  const script = document.createElement('script');
  script.id = MERCADOPAGO_SDK_SCRIPT_ID;
  script.src = MERCADOPAGO_SDK_SCRIPT_URL;
  script.async = true;

  const carga = enlazarCargaScript(script);
  document.body.appendChild(script);
  await carga;
}

export function isMercadoPagoSdkReady(): boolean {
  return typeof window !== 'undefined' && Boolean(window.MercadoPago);
}
