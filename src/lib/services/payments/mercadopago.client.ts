import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getMercadoPagoAccessToken } from '@/lib/constants/mercadopago';

let mpConfig: MercadoPagoConfig | null = null;
let paymentClient: Payment | null = null;

/**
 * Configuración singleton del SDK Mercado Pago (backend).
 * Usa MERCADOPAGO_ACCESS_TOKEN (TEST-… en sandbox).
 */
export function getMercadoPagoConfig(): MercadoPagoConfig {
  if (!mpConfig) {
    mpConfig = new MercadoPagoConfig({
      accessToken: getMercadoPagoAccessToken(),
    });
  }
  return mpConfig;
}

export function getMercadoPagoPaymentClient(): Payment {
  if (!paymentClient) {
    paymentClient = new Payment(getMercadoPagoConfig());
  }
  return paymentClient;
}
