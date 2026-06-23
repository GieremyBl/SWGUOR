"use client";

import { useCallback, useEffect, useRef, useState } from "react";



interface CulqiInstance {
  token?: { id: string };
  order?: unknown;
  error?: { user_message: string };
  culqi: () => void;
  open: () => void;
  close: () => void;
}

interface CulqiConfig {
  settings: {
    title: string;
    currency: string;
    amount: number;
    order: string;
    xculqirsaid: string;
    rsapublickey: string;
  };
  client: { email: string };
  options: {
    lang: string;
    installments: boolean;
    modal: boolean;
    container?: string;
    paymentMethods: { tarjeta?: boolean; yape?: boolean; billetera?: boolean; bancaMovil?: boolean; agente?: boolean; cuotealo?: boolean };
    paymentMethodsSort: string[];
  };
}


interface CheckoutImplementProps {
  amount: number;
  description: string;
  orderId: string;
  onSuccess?: (chargeId: string) => void;
  onError?: (msg: string) => void;
}

const CULQI_CONFIG = {
  PUBLIC_KEY: process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!,
  RSA_ID: process.env.NEXT_PUBLIC_CULQI_RSA_ID!,
  RSA_PUBLIC_KEY: process.env.NEXT_PUBLIC_CULQI_RSA_PUBLIC_KEY!,
  TITLE: process.env.NEXT_PUBLIC_CULQI_TITLE!,
  PAYMENT_METHODS: { yape: true, tarjeta: true, bancaMovil: true },
};

export default function CheckoutImplement({
  amount,
  description,
  orderId,
  onSuccess,
  onError,
}: CheckoutImplementProps) {
  const [error, setError] = useState('');
  const scriptsLoadedRef = useRef<boolean>(false);
  const culqiInstanceRef = useRef<CulqiInstance | null>(null);

  const createCulqiConfig = useCallback((): CulqiConfig => ({
    settings: {
      title: description,
      currency: 'PEN',
      amount,
      order: orderId,
      xculqirsaid: CULQI_CONFIG.RSA_ID,
      rsapublickey: CULQI_CONFIG.RSA_PUBLIC_KEY,
    },
    client: {
      email: 'donvoid@gmail.com',
    },
    options: {
      lang: 'auto',
      installments: false,
      modal: false,
      container: '#culqi-checkout-container',
      paymentMethods: CULQI_CONFIG.PAYMENT_METHODS,
      paymentMethodsSort: ['yape', 'tarjeta', 'bancaMovil'],
    },
  }), [amount, description, orderId]);

  const handleToken = useCallback(async (tokenId: string) => {
    setError('');
    try {
      const response = await fetch('/api/culqi/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenId,
          amount,
          currency_code: 'PEN',
          email: 'donvoid@gmail.com',
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.data?.id ?? '');
      } else {
        const msg = data.message || 'Error al procesar el pago';
        setError(msg);
        onError?.(msg);
      }
    } catch (err) {
      const msg = 'Error de conexión. Intenta nuevamente.';
      setError(msg);
      onError?.(msg);
    }
  }, [amount, onSuccess, onError]);

  const initializeCulqi = useCallback(() => {
    if (!(window as any).CulqiCheckout) return;

    const config = createCulqiConfig();
    const instance = new (window as any).CulqiCheckout(CULQI_CONFIG.PUBLIC_KEY, config);

    instance.culqi = function () {
      if (instance.token) {
        handleToken(instance.token.id);
      } else if (instance.order) {
        console.log('Order creada:', instance.order);
      } else {
        const msg = instance.error?.user_message || 'Error al procesar el pago';
        setError(msg);
        onError?.(msg);
      }
    };

    culqiInstanceRef.current = instance;
    instance.open();
  }, [createCulqiConfig, handleToken, onError]);

  useEffect(() => {
    if (scriptsLoadedRef.current) return;

    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.body.appendChild(script);
      });

    const loadScripts = async () => {
      try {
        await loadScript('https://3ds.culqi.com');
        await loadScript('https://js.culqi.com/checkout-js');
        scriptsLoadedRef.current = true;
        initializeCulqi();
      } catch {
        const msg = 'Error al cargar el sistema de pagos. Recarga la página.';
        setError(msg);
        onError?.(msg);
      }
    };

    loadScripts();
  }, [initializeCulqi, onError]);

  return (
    <div className="min-w-screen h-screen flex flex-col items-center p-4">
      {error && (
        <p className="text-red-500 text-sm mb-3">{error}</p>
      )}
      <div id="culqi-checkout-container" className="w-full h-full" />
    </div>
  );
}