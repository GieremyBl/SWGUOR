import { NextResponse } from 'next/server';
import { isFacturacionSimuladaError } from '@/lib/helpers/facturacion-simulada.helper';
import type { CulqiCheckoutErrorResponse } from '@/lib/schemas/culqi-checkout';
import { isCierreVentaCulqiError } from '@/lib/services/cierre-venta-culqi.service';
import { isCulqiPedidoPagoError } from '@/lib/services/culqi-charge.service';
import { isPaymentGatewayError } from '@/lib/services/payments/payment-gateway.error';
import { isPagoIdempotenciaError } from '@/lib/services/pago-idempotencia.service';

export function jsonCheckoutError(
  payload: CulqiCheckoutErrorResponse,
  status: number,
): NextResponse {
  return NextResponse.json(payload, { status });
}

export function mapCheckoutRouteError(error: unknown): NextResponse {
  if (
    isPagoIdempotenciaError(error) ||
    isCulqiPedidoPagoError(error) ||
    isPaymentGatewayError(error) ||
    isCierreVentaCulqiError(error)
  ) {
    return jsonCheckoutError(
      {
        success: false,
        message: error.message,
        code: error.code,
      },
      error.status,
    );
  }

  if (isFacturacionSimuladaError(error)) {
    return jsonCheckoutError(
      {
        success: false,
        message: error.message,
        code: error.code,
      },
      400,
    );
  }

  if (error instanceof Error && error.message.includes('CULQI_SECRET_KEY')) {
    console.error('[POST /api/culqi/charge]', error.message);
    return jsonCheckoutError(
      {
        success: false,
        message: 'Error de configuración del servidor',
        code: 'CULQI_CONFIG_ERROR',
      },
      500,
    );
  }

  console.error('[POST /api/culqi/charge]', error);
  return jsonCheckoutError(
    {
      success: false,
      message: 'Error del servidor',
      code: 'SERVER_ERROR',
    },
    500,
  );
}
