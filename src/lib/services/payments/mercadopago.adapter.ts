import { EstadoPago, type MetodoPago } from '@prisma/client';
interface MercadoPagoPaymentResult {
  id?: number;
  status?: string;
  status_detail?: string;
  payment_method_id?: string;
}
import {
  getMercadoPagoPublicKey,
  MERCADOPAGO_DEFAULT_CURRENCY,
} from '@/lib/constants/mercadopago';
import {
  normalizeMercadoPagoCurrency,
  toMercadoPagoAmount,
} from '@/lib/helpers/mercadopago-amount.helper';
import {
  esMercadoPagoAprobado,
  esMercadoPagoEnProceso,
  esMercadoPagoRechazado,
  mapMercadoPagoStatusAEstadoPago,
  mensajeMercadoPagoPorEstado,
} from '@/lib/helpers/mercadopago-status.helper';
import type { IPaymentGateway } from '@/lib/services/payments/ipayment-gateway';
import { PaymentGatewayError } from '@/lib/services/payments/payment-gateway.error';
import { obtenerMontoCobroPedidoDesdeBd } from '@/lib/services/payments/payment-order-amount.service';
import type {
  CargoProcesadoResult,
  IntencionPagoResult,
  MonedaPago,
  PagoMetadata,
} from '@/lib/services/payments/payment-gateway.types';
import { getMercadoPagoPaymentClient } from '@/lib/services/payments/mercadopago.client';

function resolverPedidoId(metadata: PagoMetadata): number {
  const pedidoId = Number(metadata.pedido_id);
  if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
    throw new PaymentGatewayError(
      'ID de pedido inválido',
      'PEDIDO_INVALIDO',
      400,
      'mercadopago',
    );
  }
  return pedidoId;
}

function resolverEmail(metadata: PagoMetadata): string {
  const email = metadata.email?.trim();
  if (!email) {
    throw new PaymentGatewayError(
      'Correo del cliente requerido',
      'EMAIL_REQUERIDO',
      400,
      'mercadopago',
    );
  }
  return email;
}

function inferirMetodoPagoDesdeMercadoPago(paymentMethodId?: string): MetodoPago {
  const method = String(paymentMethodId ?? '').toLowerCase();
  if (method.includes('master')) return 'mastercard';
  return 'visa';
}

function mapPaymentResponseToCargo(
  payment: MercadoPagoPaymentResult,
  montoValidado: { amountSoles: number; amountCents: number; currencyCode: MonedaPago },
): CargoProcesadoResult {
  const mpStatus = String(payment.status ?? 'pending');
  const estadoPago = mapMercadoPagoStatusAEstadoPago(mpStatus);
  const transactionId = String(payment.id ?? '');
  const metodoPago = inferirMetodoPagoDesdeMercadoPago(payment.payment_method_id);
  const message = mensajeMercadoPagoPorEstado(mpStatus);

  if (esMercadoPagoAprobado(mpStatus)) {
    return {
      success: true,
      gateway: 'mercadopago',
      transactionId,
      monto: montoValidado,
      metodoPago,
      estadoPago,
      gatewayStatus: mpStatus,
      rawData: payment,
      message,
      code: 'mp_payment_approved',
    };
  }

  if (esMercadoPagoEnProceso(mpStatus)) {
    return {
      success: false,
      gateway: 'mercadopago',
      httpStatus: 202,
      message,
      code: 'MP_EN_PROCESO',
      estadoPago,
      gatewayStatus: mpStatus,
      transactionId,
    };
  }

  if (esMercadoPagoRechazado(mpStatus)) {
    return {
      success: false,
      gateway: 'mercadopago',
      httpStatus: 400,
      message: payment.status_detail
        ? `${message} (${payment.status_detail})`
        : message,
      code: 'MP_RECHAZADO',
      estadoPago,
      gatewayStatus: mpStatus,
      transactionId,
    };
  }

  return {
    success: false,
    gateway: 'mercadopago',
    httpStatus: 400,
    message,
    code: 'MP_ESTADO_DESCONOCIDO',
    estadoPago: EstadoPago.pendiente,
    gatewayStatus: mpStatus,
    transactionId,
  };
}

export class MercadoPagoAdapter implements IPaymentGateway {
  readonly gatewayId = 'mercadopago' as const;

  async crearIntencionPago(
    monto: number,
    moneda: MonedaPago,
    metadata: PagoMetadata,
  ): Promise<IntencionPagoResult> {
    const pedidoId = resolverPedidoId(metadata);
    const email = resolverEmail(metadata);

    const montoValidado = await obtenerMontoCobroPedidoDesdeBd(
      BigInt(pedidoId),
      monto > 0 ? monto : undefined,
    );

    const currency = normalizeMercadoPagoCurrency(
      moneda || montoValidado.currencyCode || MERCADOPAGO_DEFAULT_CURRENCY,
    );
    const transactionAmount = toMercadoPagoAmount(montoValidado.amountSoles);

    return {
      gateway: this.gatewayId,
      intentId: `mp-intent-${pedidoId}-${transactionAmount}`,
      monto: transactionAmount,
      moneda: currency,
      amountCents: montoValidado.amountCents,
      metadata: {
        ...metadata,
        pedido_id: pedidoId,
        email,
      },
      clientData: {
        public_key: getMercadoPagoPublicKey(),
        transaction_amount: transactionAmount,
        currency_id: currency,
      },
    };
  }

  async procesarCargo(
    token: string,
    monto: number,
    moneda: MonedaPago,
    metadata: PagoMetadata,
  ): Promise<CargoProcesadoResult> {
    const pedidoId = resolverPedidoId(metadata);
    const email = resolverEmail(metadata);
    const cardToken = token?.trim();
    const paymentMethodId = String(metadata.payment_method_id ?? '').trim();

    if (!cardToken) {
      throw new PaymentGatewayError(
        'Token de tarjeta requerido',
        'TOKEN_REQUERIDO',
        400,
        'mercadopago',
      );
    }

    if (!paymentMethodId) {
      throw new PaymentGatewayError(
        'payment_method_id requerido (visa, master, etc.)',
        'PAYMENT_METHOD_REQUERIDO',
        400,
        'mercadopago',
      );
    }

    const montoValidado = await obtenerMontoCobroPedidoDesdeBd(
      BigInt(pedidoId),
      monto > 0 ? monto : undefined,
    );

    const currency = normalizeMercadoPagoCurrency(
      moneda || montoValidado.currencyCode || MERCADOPAGO_DEFAULT_CURRENCY,
    );
    const transactionAmount = toMercadoPagoAmount(montoValidado.amountSoles);
    const installments = Number(metadata.installments ?? 1) || 1;

    const paymentClient = getMercadoPagoPaymentClient();

    let payment: MercadoPagoPaymentResult;
    try {
      payment = await paymentClient.create({
        body: {
          transaction_amount: transactionAmount,
          token: cardToken,
          description:
            metadata.description?.trim() ||
            `Pago pedido #${pedidoId} — GUOR`,
          installments,
          payment_method_id: paymentMethodId,
          issuer_id: metadata.issuer_id ? Number(metadata.issuer_id) : undefined,
          payer: { email },
          external_reference: String(pedidoId),
          metadata: {
            pedido_id: String(pedidoId),
          },
        },
        requestOptions: {
          idempotencyKey: `mp-pedido-${pedidoId}-${transactionAmount}-${Date.now()}`,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo procesar el pago con Mercado Pago';
      throw new PaymentGatewayError(
        message,
        'MP_PAYMENT_ERROR',
        502,
        'mercadopago',
      );
    }

    return mapPaymentResponseToCargo(payment, {
      ...montoValidado,
      amountSoles: transactionAmount,
      currencyCode: currency,
    });
  }
}
