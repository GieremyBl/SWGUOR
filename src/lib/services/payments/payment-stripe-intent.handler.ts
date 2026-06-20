import { NextResponse } from 'next/server';
import { getStripePublishableKey } from '@/lib/constants/stripe';
import { mapStripeIntentRouteError } from '@/lib/helpers/stripe-intent-route.helper';
import {
  stripeIntentRequestSchema,
  type StripeIntentSuccessResponse,
} from '@/lib/schemas/stripe-intent';
import { validarIdempotenciaPagoPedido } from '@/lib/services/pago-idempotencia.service';
import {
  assertMetodoPagoEsperado,
  ejecutarIntencionCheckout,
} from '@/lib/services/payments/payment-checkout.orchestrator';

export async function procesarStripeIntent(body: unknown): Promise<NextResponse> {
  try {
    const parsed = stripeIntentRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          message: firstIssue?.message ?? 'Datos inválidos',
          code: 'DATOS_INCOMPLETOS',
        },
        { status: 400 },
      );
    }

    assertMetodoPagoEsperado(parsed.data.metodo_pago, 'stripe');

    const { pedido_id, email, monto_a_pagar, description } = parsed.data;

    await validarIdempotenciaPagoPedido(pedido_id);

    const metadata = { pedido_id, email, description };

    const intencion = await ejecutarIntencionCheckout(
      'stripe',
      monto_a_pagar ?? 0,
      'PEN',
      metadata,
    );

    const clientSecret = intencion.clientData?.client_secret;
    const paymentIntentId = intencion.clientData?.payment_intent_id ?? intencion.intentId;

    if (!clientSecret || !paymentIntentId) {
      return NextResponse.json(
        {
          success: false,
          message: 'No se pudo obtener client_secret de Stripe',
          code: 'STRIPE_SIN_CLIENT_SECRET',
        },
        { status: 502 },
      );
    }

    const successPayload: StripeIntentSuccessResponse = {
      success: true,
      data: {
        client_secret: String(clientSecret),
        payment_intent_id: String(paymentIntentId),
        amount: intencion.monto,
        amount_stripe: Number(intencion.clientData?.amount_stripe ?? intencion.amountCents),
        currency: String(intencion.clientData?.currency ?? 'usd'),
        publishable_key: getStripePublishableKey(),
        pedido_id,
      },
    };

    return NextResponse.json(successPayload, { status: 200 });
  } catch (error) {
    return mapStripeIntentRouteError(error);
  }
}
