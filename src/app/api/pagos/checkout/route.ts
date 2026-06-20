export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { procesarCheckoutCulqi } from '@/lib/services/payments/payment-culqi-checkout.handler';
import { procesarStripeConfirm } from '@/lib/services/payments/payment-stripe-confirm.handler';
import { procesarStripeIntent } from '@/lib/services/payments/payment-stripe-intent.handler';
import {
  pagoCheckoutRequestSchema,
  resolverAccionCheckout,
} from '@/lib/schemas/pago-checkout';
import { isPaymentGatewayError } from '@/lib/services/payments/payment-gateway.error';
import { normalizarMetodoPago } from '@/lib/services/payments/payment-checkout.orchestrator';

/**
 * POST /api/pagos/checkout
 *
 * Despacha estrictamente por metodo_pago sin efectos secundarios en otras pasarelas.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const metodoPagoRaw =
      typeof body.metodo_pago === 'string' ? body.metodo_pago : undefined;

    if (!metodoPagoRaw) {
      return NextResponse.json(
        {
          success: false,
          message: 'metodo_pago es requerido (culqi | stripe | mercadopago)',
          code: 'METODO_PAGO_REQUERIDO',
        },
        { status: 400 },
      );
    }

    const metodoPago = normalizarMetodoPago(metodoPagoRaw, 'culqi');
    const accion = resolverAccionCheckout(
      typeof body.accion === 'string'
        ? pagoCheckoutRequestSchema.shape.accion.safeParse(body.accion).data
        : undefined,
      metodoPago,
    );

    const payload =
      body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
        ? { metodo_pago: metodoPago, ...(body.payload as Record<string, unknown>) }
        : { metodo_pago: metodoPago, ...body };

    switch (metodoPago) {
      case 'culqi':
        if (accion !== 'cargo') {
          return NextResponse.json(
            {
              success: false,
              message: 'Culqi solo admite accion="cargo" en este endpoint',
              code: 'ACCION_NO_PERMITIDA',
            },
            { status: 400 },
          );
        }
        return procesarCheckoutCulqi(payload);

      case 'stripe':
        if (accion === 'intencion') {
          return procesarStripeIntent(payload);
        }
        if (accion === 'confirm') {
          return procesarStripeConfirm(payload);
        }
        return NextResponse.json(
          {
            success: false,
            message: 'Stripe requiere accion="intencion" o accion="confirm"',
            code: 'ACCION_NO_PERMITIDA',
          },
          { status: 400 },
        );

      case 'mercadopago':
        return NextResponse.json(
          {
            success: false,
            message: 'Use /api/pagos/mercadopago/charge para Mercado Pago',
            code: 'USAR_ENDPOINT_MERCADOPAGO',
          },
          { status: 400 },
        );

      default: {
        const _exhaustive: never = metodoPago;
        return NextResponse.json(
          {
            success: false,
            message: 'metodo_pago no soportado',
            code: 'METODO_PAGO_INVALIDO',
          },
          { status: 400 },
        );
      }
    }
  } catch (error) {
    if (isPaymentGatewayError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          code: error.code,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Error interno al procesar el checkout',
        code: 'CHECKOUT_ERROR',
      },
      { status: 500 },
    );
  }
}
