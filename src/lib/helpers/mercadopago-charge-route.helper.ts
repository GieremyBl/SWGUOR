import { NextResponse } from 'next/server';
import type { MercadoPagoChargeErrorResponse } from '@/lib/schemas/mercadopago-payment';
import { isPaymentGatewayError } from '@/lib/services/payments/payment-gateway.error';
import { isCierreVentaCulqiError } from '@/lib/services/cierre-venta-culqi.service';
import { isPagoIdempotenciaError } from '@/lib/services/pago-idempotencia.service';

export function jsonMercadoPagoChargeError(
  payload: MercadoPagoChargeErrorResponse,
  status: number,
): NextResponse {
  return NextResponse.json(payload, { status });
}

export function mapMercadoPagoChargeRouteError(error: unknown): NextResponse {
  if (
    isPagoIdempotenciaError(error) ||
    isPaymentGatewayError(error) ||
    isCierreVentaCulqiError(error)
  ) {
    return jsonMercadoPagoChargeError(
      {
        success: false,
        message: error.message,
        code: error.code,
      },
      error.status,
    );
  }

  if (error instanceof Error && error.message.includes('MERCADOPAGO_ACCESS_TOKEN')) {
    console.error('[POST /api/pagos/mercadopago/charge]', error.message);
    return jsonMercadoPagoChargeError(
      {
        success: false,
        message: 'Error de configuración del servidor',
        code: 'MP_CONFIG_ERROR',
      },
      500,
    );
  }

  console.error('[POST /api/pagos/mercadopago/charge]', error);
  return jsonMercadoPagoChargeError(
    {
      success: false,
      message: 'Error del servidor',
      code: 'SERVER_ERROR',
    },
    500,
  );
}
