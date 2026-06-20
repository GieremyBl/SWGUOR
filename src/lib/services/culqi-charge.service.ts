import type { CulqiChargeSuccessBody } from '@/lib/helpers/culqi-response.helper';
import type { MetodoPago } from '@prisma/client';
import {
  assertMetodoPagoEsperado,
  ejecutarCargoCheckout,
  ejecutarIntencionCheckout,
} from '@/lib/services/payments/payment-checkout.orchestrator';
import type { MontoCobroValidado } from '@/lib/services/payments/payment-gateway.types';
import {
  CulqiPedidoPagoError,
  isCulqiPedidoPagoError,
} from '@/lib/services/payments/payment-gateway.error';
import { obtenerMontoCobroPedidoDesdeBd } from '@/lib/services/payments/payment-order-amount.service';

export { CulqiPedidoPagoError, isCulqiPedidoPagoError };
export { obtenerMontoCobroPedidoDesdeBd };

export interface EjecutarCargoCulqiPedidoInput {
  pedidoId: number;
  token?: string;
  sourceId?: string;
  email: string;
  description?: string;
  /** monto_a_pagar en soles; si se omite, se cobra el saldo pendiente completo */
  montoSoles?: number;
}

export type PedidoMontoCobro = MontoCobroValidado;

export type EjecutarCargoCulqiPedidoResult =
  | {
      success: true;
      culqiChargeId: string;
      culqiData: CulqiChargeSuccessBody;
      monto: PedidoMontoCobro;
      metodoPago: MetodoPago;
      message: string;
      code?: string;
    }
  | {
      success: false;
      httpStatus: number;
      message: string;
      code?: string;
    };

/**
 * Fachada retrocompatible que delega en CulqiAdapter vía IPaymentGateway.
 */
export async function ejecutarCargoCulqiPedido(
  input: EjecutarCargoCulqiPedidoInput,
): Promise<EjecutarCargoCulqiPedidoResult> {
  const gateway = 'culqi' as const;
  const paymentSource = input.sourceId ?? input.token;

  const metadata = {
    pedido_id: input.pedidoId,
    email: input.email,
    description: input.description,
    metodo_pago: gateway,
  };

  assertMetodoPagoEsperado(gateway, 'culqi');

  await ejecutarIntencionCheckout('culqi', input.montoSoles ?? 0, 'PEN', metadata);

  const cargo = await ejecutarCargoCheckout(
    'culqi',
    paymentSource ?? '',
    input.montoSoles ?? 0,
    'PEN',
    metadata,
  );

  if (!cargo.success) {
    return {
      success: false,
      httpStatus: cargo.httpStatus,
      message: cargo.message,
      code: cargo.code,
    };
  }

  return {
    success: true,
    culqiChargeId: cargo.transactionId,
    culqiData: (cargo.rawData ?? {}) as CulqiChargeSuccessBody,
    monto: cargo.monto,
    metodoPago: cargo.metodoPago,
    message: cargo.message,
    code: cargo.code,
  };
}
