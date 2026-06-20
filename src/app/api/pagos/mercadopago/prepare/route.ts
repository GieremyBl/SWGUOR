export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoPublicKey } from '@/lib/constants/mercadopago';
import { mapMercadoPagoChargeRouteError } from '@/lib/helpers/mercadopago-charge-route.helper';
import { stripeIntentRequestSchema } from '@/lib/schemas/stripe-intent';
import { validarIdempotenciaPagoPedido } from '@/lib/services/pago-idempotencia.service';
import { createPaymentGateway } from '@/lib/services/payments/payment-gateway.factory';

/**
 * POST /api/pagos/mercadopago/prepare
 *
 * Valida monto en BD y devuelve datos para tokenizar tarjeta en el frontend MP.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    const { pedido_id, email, monto_a_pagar, description } = parsed.data;

    await validarIdempotenciaPagoPedido(pedido_id);

    const gateway = createPaymentGateway('mercadopago');
    const intencion = await gateway.crearIntencionPago(
      monto_a_pagar ?? 0,
      'PEN',
      { pedido_id, email, description },
    );

    return NextResponse.json({
      success: true,
      data: {
        pedido_id,
        amount: intencion.monto,
        currency: intencion.moneda,
        public_key: getMercadoPagoPublicKey(),
        intent_id: intencion.intentId,
      },
    });
  } catch (error) {
    return mapMercadoPagoChargeRouteError(error);
  }
}
