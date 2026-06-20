export interface CulqiApiErrorBody {
  object?: string;
  type?: string;
  merchant_message?: string;
  user_message?: string;
  code?: string;
  param?: string;
}

export interface CulqiChargeSuccessBody {
  id?: string;
  amount?: number;
  currency_code?: string;
  email?: string;
  outcome?: {
    type?: string;
    code?: string;
    merchant_message?: string;
    user_message?: string;
  };
  source?: {
    type?: string;
    brand?: string;
    iin?: { card_brand?: string };
  };
  [key: string]: unknown;
}

export interface CulqiChargeMappedResponse {
  success: boolean;
  httpStatus: number;
  message: string;
  code?: string;
  data?: CulqiChargeSuccessBody;
}

const CULQI_ERROR_MESSAGES: Record<string, string> = {
  insufficient_funds: 'Fondos insuficientes en la tarjeta',
  stolen_card: 'Tarjeta rechazada. Contacte a su banco',
  lost_card: 'Tarjeta rechazada. Contacte a su banco',
  expired_card: 'La tarjeta está vencida',
  invalid_cvc: 'Código de seguridad (CVV) inválido',
  processing_error: 'Error al procesar el pago. Intente nuevamente',
  api_error: 'Error temporal en la pasarela de pago',
};

export function mapCulqiUserMessage(body: CulqiApiErrorBody): string {
  const code = body.code?.trim();
  if (code && CULQI_ERROR_MESSAGES[code]) {
    return CULQI_ERROR_MESSAGES[code];
  }

  const userMessage = body.user_message?.trim();
  if (userMessage) return userMessage;

  const merchantMessage = body.merchant_message?.trim();
  if (merchantMessage) return merchantMessage;

  return 'No se pudo procesar el pago';
}

export function mapCulqiChargeHttpResponse(
  httpStatus: number,
  rawBody: unknown,
): CulqiChargeMappedResponse {
  const body = (rawBody ?? {}) as CulqiApiErrorBody & CulqiChargeSuccessBody;

  if (httpStatus >= 200 && httpStatus < 300) {
    return {
      success: true,
      httpStatus: 200,
      message: 'Cargo procesado correctamente',
      code: body.outcome?.code ?? 'charge_successful',
      data: body,
    };
  }

  return {
    success: false,
    httpStatus: httpStatus >= 400 && httpStatus < 500 ? 400 : 502,
    message: mapCulqiUserMessage(body),
    code: body.code ?? body.type ?? 'culqi_charge_failed',
  };
}
