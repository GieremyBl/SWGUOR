import { EstadoPago, type MetodoPago } from '@prisma/client';
import type Stripe from 'stripe';
import {
  getStripePublishableKey,
  STRIPE_DEFAULT_CURRENCY,
} from '@/lib/constants/stripe';
import {
  fromStripeAmount,
  toStripeAmount,
  toStripeCurrencyCode,
} from '@/lib/helpers/stripe-amount.helper';
import {
  convertPenToUsd,
  getUsdToPenExchangeRate,
} from '@/lib/services/exchange-rate.service';
import type { IPaymentGateway } from '@/lib/services/payments/ipayment-gateway';
import { PaymentGatewayError } from '@/lib/services/payments/payment-gateway.error';
import { obtenerMontoCobroPedidoDesdeBd } from '@/lib/services/payments/payment-order-amount.service';
import type {
  CargoProcesadoResult,
  IntencionPagoResult,
  MonedaPago,
  PagoMetadata,
} from '@/lib/services/payments/payment-gateway.types';
import { getStripeClient } from '@/lib/services/payments/stripe.client';

function resolverPedidoId(metadata: PagoMetadata): number {
  const pedidoId = Number(metadata.pedido_id);
  if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
    throw new PaymentGatewayError(
      'ID de pedido inválido',
      'PEDIDO_INVALIDO',
      400,
      'stripe',
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
      'stripe',
    );
  }
  return email;
}


async function inferirMetodoPagoDesdeStripeIntent(
  stripe: Stripe,
  intent: Stripe.PaymentIntent,
): Promise<MetodoPago> {
  const paymentMethodId =
    typeof intent.payment_method === 'string'
      ? intent.payment_method
      : intent.payment_method?.id;

  if (!paymentMethodId) return 'visa';

  try {
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.card?.brand === 'mastercard') return 'mastercard';
  } catch {
    // fallback seguro
  }

  return 'visa';
}

export class StripeAdapter implements IPaymentGateway {
  readonly gatewayId = 'stripe' as const;

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

    const sourceCurrency = (
      moneda ||
      montoValidado.currencyCode ||
      STRIPE_DEFAULT_CURRENCY
    ).toUpperCase();

    const stripeCurrency = 'usd';
    let stripeAmountMajor = montoValidado.amountSoles;
    let exchangeRateUsed: number | undefined;

    if (sourceCurrency === 'PEN') {
      exchangeRateUsed = await getUsdToPenExchangeRate();
      stripeAmountMajor = await convertPenToUsd(montoValidado.amountSoles);
    }

    const amountStripe = toStripeAmount(stripeAmountMajor, stripeCurrency);

    const stripe = getStripeClient();

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountStripe,
        currency: stripeCurrency,
        receipt_email: email,
        automatic_payment_methods: { enabled: true },
        metadata: {
          pedido_id: String(pedidoId),
          monto_pen_soles: String(montoValidado.amountSoles),
          monto_usd: String(stripeAmountMajor),
          ...(exchangeRateUsed
            ? { exchange_rate_usd_pen: String(exchangeRateUsed) }
            : {}),
          ...(metadata.description ? { description: metadata.description } : {}),
        },
        description:
          metadata.description?.trim() ||
          `Pago pedido #${pedidoId} — GUOR`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo crear el PaymentIntent';
      throw new PaymentGatewayError(
        message,
        'STRIPE_INTENT_ERROR',
        502,
        'stripe',
      );
    }

    if (!paymentIntent.client_secret) {
      throw new PaymentGatewayError(
        'Stripe no devolvió client_secret',
        'STRIPE_SIN_CLIENT_SECRET',
        502,
        'stripe',
      );
    }

    return {
      gateway: this.gatewayId,
      intentId: paymentIntent.id,
      monto: montoValidado.amountSoles,
      moneda: 'PEN',
      amountCents: montoValidado.amountCents,
      metadata: {
        ...metadata,
        pedido_id: pedidoId,
        email,
      },
      clientData: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        publishable_key: getStripePublishableKey(),
        amount_stripe: amountStripe,
        currency: stripeCurrency,
        monto_usd: stripeAmountMajor,
        exchange_rate: exchangeRateUsed,
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
    const paymentRef = token?.trim();

    if (!paymentRef) {
      throw new PaymentGatewayError(
        'PaymentIntent o payment_method requerido',
        'TOKEN_REQUERIDO',
        400,
        'stripe',
      );
    }

    const montoValidado = await obtenerMontoCobroPedidoDesdeBd(
      BigInt(pedidoId),
      monto > 0 ? monto : undefined,
    );

    const stripe = getStripeClient();
    let intent: Stripe.PaymentIntent;

    try {
      if (paymentRef.startsWith('pi_')) {
        intent = await stripe.paymentIntents.retrieve(paymentRef, {
          expand: ['payment_method'],
        });

        if (intent.status === 'requires_payment_method' && metadata.payment_method_id) {
          intent = await stripe.paymentIntents.confirm(paymentRef, {
            payment_method: String(metadata.payment_method_id),
          });
        }
      } else if (paymentRef.startsWith('pm_')) {
        const intentId = metadata.payment_intent_id;
        if (!intentId) {
          throw new PaymentGatewayError(
            'payment_intent_id requerido para confirmar con payment_method',
            'STRIPE_INTENT_ID_REQUERIDO',
            400,
            'stripe',
          );
        }
        intent = await stripe.paymentIntents.confirm(String(intentId), {
          payment_method: paymentRef,
        });
      } else {
        throw new PaymentGatewayError(
          'Token de Stripe inválido (se esperaba pi_ o pm_)',
          'STRIPE_TOKEN_INVALIDO',
          400,
          'stripe',
        );
      }
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error;

      const message =
        error instanceof Error ? error.message : 'Error al procesar cargo Stripe';
      return {
        success: false,
        gateway: this.gatewayId,
        httpStatus: 400,
        message,
        code: 'STRIPE_CHARGE_FAILED',
      };
    }

    if (intent.status !== 'succeeded') {
      return {
        success: false,
        gateway: this.gatewayId,
        httpStatus: 400,
        message: `El pago no se completó (estado: ${intent.status})`,
        code: 'STRIPE_PAGO_INCOMPLETO',
      };
    }

    const currency = intent.currency ?? toStripeCurrencyCode(moneda);
    const chargedMinor = intent.amount_received ?? intent.amount;
    const metaMontoPen = Number(intent.metadata?.monto_pen_soles);
    const metaMontoUsd = Number(intent.metadata?.monto_usd);

    let amountSoles = montoValidado.amountSoles;

    if (currency.toLowerCase() === 'usd') {
      const chargedUsd = fromStripeAmount(chargedMinor, currency);
      const expectedUsd = Number.isFinite(metaMontoUsd)
        ? metaMontoUsd
        : await convertPenToUsd(montoValidado.amountSoles);

      if (Math.abs(chargedUsd - expectedUsd) > 0.01) {
        return {
          success: false,
          gateway: this.gatewayId,
          httpStatus: 400,
          message: 'El monto cobrado en USD no coincide con el monto validado',
          code: 'STRIPE_MONTO_INCONSISTENTE',
        };
      }

      amountSoles = Number.isFinite(metaMontoPen)
        ? metaMontoPen
        : montoValidado.amountSoles;

      if (Math.abs(amountSoles - montoValidado.amountSoles) > 0.01) {
        return {
          success: false,
          gateway: this.gatewayId,
          httpStatus: 400,
          message: 'El monto en soles no coincide con el monto validado',
          code: 'STRIPE_MONTO_INCONSISTENTE',
        };
      }
    } else {
      amountSoles = fromStripeAmount(chargedMinor, currency);

      if (Math.abs(amountSoles - montoValidado.amountSoles) > 0.01) {
        return {
          success: false,
          gateway: this.gatewayId,
          httpStatus: 400,
          message: 'El monto cobrado no coincide con el monto validado',
          code: 'STRIPE_MONTO_INCONSISTENTE',
        };
      }
    }

    return {
      success: true,
      gateway: this.gatewayId,
      transactionId: intent.id,
      monto: {
        ...montoValidado,
        amountSoles,
        currencyCode: 'PEN',
      },
      metodoPago: await inferirMetodoPagoDesdeStripeIntent(stripe, intent),
      estadoPago: EstadoPago.pagado,
      gatewayStatus: 'succeeded',
      rawData: intent,
      message: 'Cargo Stripe procesado correctamente',
      code: 'stripe_payment_succeeded',
    };
  }
}
