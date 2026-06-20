import { NextResponse } from 'next/server';
import type { StripeIntentErrorResponse } from '@/lib/schemas/stripe-intent';
import { isPaymentGatewayError } from '@/lib/services/payments/payment-gateway.error';
import { isPagoIdempotenciaError } from '@/lib/services/pago-idempotencia.service';

export function jsonStripeIntentError(
  payload: StripeIntentErrorResponse,
  status: number,
): NextResponse {
  return NextResponse.json(payload, { status });
}

export function mapStripeIntentRouteError(error: unknown): NextResponse {
  if (isPagoIdempotenciaError(error) || isPaymentGatewayError(error)) {
    return jsonStripeIntentError(
      {
        success: false,
        message: error.message,
        code: error.code,
      },
      error.status,
    );
  }

  if (error instanceof Error && error.message.includes('STRIPE_SECRET_KEY')) {
    console.error('[POST /api/pagos/stripe/intent]', error.message);
    return jsonStripeIntentError(
      {
        success: false,
        message: 'Error de configuración del servidor',
        code: 'STRIPE_CONFIG_ERROR',
      },
      500,
    );
  }

  if (error instanceof Error && error.message.includes('STRIPE_PUBLISHABLE_KEY')) {
    console.error('[POST /api/pagos/stripe/intent]', error.message);
    return jsonStripeIntentError(
      {
        success: false,
        message: 'Error de configuración del cliente Stripe',
        code: 'STRIPE_CONFIG_ERROR',
      },
      500,
    );
  }

  console.error('[POST /api/pagos/stripe/intent]', error);
  return jsonStripeIntentError(
    {
      success: false,
      message: 'Error del servidor',
      code: 'SERVER_ERROR',
    },
    500,
  );
}
