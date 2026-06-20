import { CulqiAdapter } from '@/lib/services/payments/culqi.adapter';
import { MercadoPagoAdapter } from '@/lib/services/payments/mercadopago.adapter';
import { StripeAdapter } from '@/lib/services/payments/stripe.adapter';
import type { IPaymentGateway } from '@/lib/services/payments/ipayment-gateway';
import type { PaymentGatewayId } from '@/lib/services/payments/payment-gateway.types';
import { PaymentGatewayError } from '@/lib/services/payments/payment-gateway.error';

const GATEWAY_ENV_KEY = 'PAYMENT_GATEWAY';

function resolverGatewayPorDefecto(): PaymentGatewayId {
  const raw = process.env[GATEWAY_ENV_KEY]?.trim().toLowerCase();
  if (raw === 'stripe' || raw === 'mercadopago' || raw === 'culqi') {
    return raw;
  }
  return 'culqi';
}

export function createPaymentGateway(
  gatewayId?: PaymentGatewayId,
): IPaymentGateway {
  const id = gatewayId ?? resolverGatewayPorDefecto();

  switch (id) {
    case 'culqi':
      return new CulqiAdapter();
    case 'stripe':
      return new StripeAdapter();
    case 'mercadopago':
      return new MercadoPagoAdapter();
    default:
      throw new PaymentGatewayError(
        'Pasarela de pago no reconocida',
        'GATEWAY_INVALIDO',
        400,
        'culqi',
      );
  }
}

export function getDefaultPaymentGateway(): IPaymentGateway {
  return createPaymentGateway();
}
