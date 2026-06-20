export {};

declare global {
  interface Window {
    CulqiCheckout: new (
      publicKey: string,
      config: CulqiCheckoutOptions,
    ) => CulqiCheckoutInstance;
    Culqi?: {
      publicKey: string;
      settings: (config: CulqiSettings) => void;
      open: () => void;
      close: () => void;
      yape: {
        generate: (params: CulqiYapeParams) => Promise<void>;
      };
      token?: CulqiToken;
      error?: CulqiError;
    };
    culqi?: () => void;
  }
}

export interface CulqiSettings {
  currency: string;
  amount: number;
  order?: string;
  xculqirsaid?: string;
  rsapublickey?: string;
}

export interface CulqiYapeParams {
  phone: string;
  code: string;
}

export interface CulqiToken {
  id: string;
  email: string;
}

export interface CulqiError {
  user_message: string;
  merchant_message: string;
  code?: string;
}

export interface CulqiCheckoutPaymentMethods {
  tarjeta?: boolean;
  yape?: boolean;
  billetera?: boolean;
  bancaMovil?: boolean;
  agente?: boolean;
  cuotealo?: boolean;
}

export interface CulqiCheckoutOptions {
  settings: {
    title: string;
    currency: string;
    amount: number;
    order?: string;
    xculqirsaid?: string;
    rsapublickey?: string;
  };
  client: { email: string };
  options: {
    lang: string;
    installments: boolean;
    modal: boolean;
    container?: string;
    paymentMethods: CulqiCheckoutPaymentMethods;
    paymentMethodsSort: string[];
  };
}

export interface CulqiCheckoutInstance {
  token?: { id: string };
  order?: unknown;
  error?: CulqiError;
  culqi: () => void;
  open: () => void;
  close: () => void;
}

export interface CulqiChargeRequest {
  amount: number;
  currency_code: 'PEN' | 'USD';
  email: string;
  token: string;
  description: string;
  installments?: number;
  metadata?: Record<string, string>;
}

export interface CulqiChargeResponse {
  id: string;
  amount: number;
  currency_code: string;
  email: string;
  status: 'paid' | 'failed' | 'pending';
  outcome: {
    type: string;
    code: string;
    merchant_message: string;
    user_message: string;
  };
  metadata: Record<string, string>;
}
