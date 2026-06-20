import type { PaymentGatewayId } from '@/lib/services/payments/payment-gateway.types';

export class PaymentGatewayError extends Error {
  readonly code: string;
  readonly status: number;
  readonly gateway: PaymentGatewayId;

  constructor(
    message: string,
    code: string,
    status: number,
    gateway: PaymentGatewayId,
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
    this.code = code;
    this.status = status;
    this.gateway = gateway;
  }
}

export class CulqiPedidoPagoError extends PaymentGatewayError {
  constructor(message: string, code: string, status: number) {
    super(message, code, status, 'culqi');
    this.name = 'CulqiPedidoPagoError';
  }
}

export function isPaymentGatewayError(error: unknown): error is PaymentGatewayError {
  return error instanceof PaymentGatewayError;
}

export function isCulqiPedidoPagoError(error: unknown): error is CulqiPedidoPagoError {
  return error instanceof CulqiPedidoPagoError;
}