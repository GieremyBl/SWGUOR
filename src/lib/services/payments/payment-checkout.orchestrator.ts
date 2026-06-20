import { CulqiAdapter } from '@/lib/services/payments/culqi.adapter';
import { MercadoPagoAdapter } from '@/lib/services/payments/mercadopago.adapter';
import { PaymentGatewayError } from '@/lib/services/payments/payment-gateway.error';
import { StripeAdapter } from '@/lib/services/payments/stripe.adapter';
import type {
  CargoProcesadoResult,
  IntencionPagoResult,
  MonedaPago,
  PagoMetadata,
  PaymentGatewayId,
} from '@/lib/services/payments/payment-gateway.types';

function crearAdaptadorPasarela(gatewayId: PaymentGatewayId) {
  switch (gatewayId) {
    case 'culqi':
      return new CulqiAdapter();
    case 'stripe':
      return new StripeAdapter();
    case 'mercadopago':
      return new MercadoPagoAdapter();
    default: {
      const _exhaustive: never = gatewayId;
      throw new PaymentGatewayError(
        'Pasarela de pago no reconocida',
        'GATEWAY_INVALIDO',
        400,
        'culqi',
      );
    }
  }
}

export function normalizarMetodoPago(
  metodoPago: string | undefined,
  fallback: PaymentGatewayId,
): PaymentGatewayId {
  const valor = (metodoPago ?? fallback).trim().toLowerCase();

  if (valor === 'culqi' || valor === 'stripe' || valor === 'mercadopago') {
    return valor;
  }

  throw new PaymentGatewayError(
    'metodo_pago inválido',
    'METODO_PAGO_INVALIDO',
    400,
    fallback,
  );
}

/** Rechaza solicitudes dirigidas a otra pasarela (evita efectos secundarios cruzados). */
export function assertMetodoPagoEsperado(
  metodoPago: string | undefined,
  esperado: PaymentGatewayId,
): PaymentGatewayId {
  const normalizado = normalizarMetodoPago(metodoPago, esperado);

  if (normalizado !== esperado) {
    throw new PaymentGatewayError(
      `Este endpoint solo procesa metodo_pago="${esperado}"`,
      'GATEWAY_NO_PERMITIDO',
      400,
      esperado,
    );
  }

  return normalizado;
}

export async function ejecutarIntencionCheckout(
  gatewayId: PaymentGatewayId,
  monto: number,
  moneda: MonedaPago,
  metadata: PagoMetadata,
): Promise<IntencionPagoResult> {
  switch (gatewayId) {
    case 'culqi':
      return crearAdaptadorPasarela('culqi').crearIntencionPago(monto, moneda, metadata);
    case 'stripe':
      return crearAdaptadorPasarela('stripe').crearIntencionPago(monto, moneda, metadata);
    case 'mercadopago':
      return crearAdaptadorPasarela('mercadopago').crearIntencionPago(
        monto,
        moneda,
        metadata,
      );
    default: {
      const _exhaustive: never = gatewayId;
      throw new PaymentGatewayError(
        'Pasarela de pago no reconocida',
        'GATEWAY_INVALIDO',
        400,
        'culqi',
      );
    }
  }
}

export async function ejecutarCargoCheckout(
  gatewayId: PaymentGatewayId,
  token: string,
  monto: number,
  moneda: MonedaPago,
  metadata: PagoMetadata,
): Promise<CargoProcesadoResult> {
  switch (gatewayId) {
    case 'culqi':
      return crearAdaptadorPasarela('culqi').procesarCargo(token, monto, moneda, metadata);
    case 'stripe':
      return crearAdaptadorPasarela('stripe').procesarCargo(token, monto, moneda, metadata);
    case 'mercadopago':
      return crearAdaptadorPasarela('mercadopago').procesarCargo(
        token,
        monto,
        moneda,
        metadata,
      );
    default: {
      const _exhaustive: never = gatewayId;
      throw new PaymentGatewayError(
        'Pasarela de pago no reconocida',
        'GATEWAY_INVALIDO',
        400,
        'culqi',
      );
    }
  }
}
