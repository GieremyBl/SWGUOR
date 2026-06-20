export interface MercadoPagoCardFormData {
  token?: string;
  payment_method_id?: string;
  installments?: number;
  issuer_id?: string;
}

export interface MercadoPagoBrickController {
  getFormData: () => Promise<
    MercadoPagoCardFormData | { formData: MercadoPagoCardFormData }
  >;
  unmount?: () => void;
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => unknown;
    paymentBrickController?: MercadoPagoBrickController;
    cardPaymentBrickController?: MercadoPagoBrickController;
  }
}

export {};
