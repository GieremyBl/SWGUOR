import {
  CULQI_CHARGES_ENDPOINT,
  CULQI_DEFAULT_CURRENCY,
  getCulqiClientConfig,
  getCulqiSecretKey,
  type CulqiCurrencyCode,
} from '@/lib/constants/culqi';
import { getCulqiWebhookMetadataPedidoKey } from '@/lib/constants/culqi-webhook';
import { toCulqiAntifraudDetails } from '@/lib/helpers/datos-pagador-pago.helper';
import type { DatosPagadorCheckout } from '@/lib/schemas/datos-pagador-pago';
import {
  mapCulqiChargeHttpResponse,
  type CulqiChargeSuccessBody,
} from '@/lib/helpers/culqi-response.helper';
import {
  inferirMetodoPagoDesdeCargoCulqi,
  type CulqiWebhookChargePayload,
} from '@/lib/helpers/culqi-webhook.helper';
import { EstadoPago } from '@prisma/client';
import type { IPaymentGateway } from '@/lib/services/payments/ipayment-gateway';
import { CulqiPedidoPagoError } from '@/lib/services/payments/payment-gateway.error';
import { obtenerMontoCobroPedidoDesdeBd } from '@/lib/services/payments/payment-order-amount.service';
import type {
  CargoProcesadoResult,
  IntencionPagoResult,
  MonedaPago,
  PagoMetadata,
} from '@/lib/services/payments/payment-gateway.types';

function normalizeMoneda(moneda: MonedaPago): CulqiCurrencyCode {
  return moneda?.toUpperCase() === 'USD' ? 'USD' : 'PEN';
}

function resolverPedidoId(metadata: PagoMetadata): number {
  const pedidoId = Number(metadata.pedido_id);
  if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
    throw new CulqiPedidoPagoError('ID de pedido inválido', 'PEDIDO_INVALIDO', 400);
  }
  return pedidoId;
}

function resolverDatosPagador(metadata: PagoMetadata): DatosPagadorCheckout | null {
  const nombres = String(metadata.pagador_nombres ?? '').trim();
  const apellidos = String(metadata.pagador_apellidos ?? '').trim();
  const telefono = String(metadata.pagador_telefono ?? '').trim();
  const direccion = String(metadata.pagador_direccion ?? '').trim();
  const ubicacion = String(metadata.pagador_ubicacion ?? '').trim();

  if (!nombres || !apellidos || !telefono || !direccion || !ubicacion) {
    return null;
  }

  return {
    pagador_nombres: nombres,
    pagador_apellidos: apellidos,
    pagador_telefono: telefono,
    pagador_usuario_id:
      metadata.pagador_usuario_id != null
        ? Number(metadata.pagador_usuario_id)
        : undefined,
    pagador_direccion: direccion,
    pagador_ubicacion: ubicacion,
    pagador_country_code: String(metadata.pagador_country_code ?? 'PE'),
  };
}

function resolverEmail(metadata: PagoMetadata): string {
  const email = metadata.email?.trim();
  if (!email) {
    throw new CulqiPedidoPagoError('Correo del cliente requerido', 'EMAIL_REQUERIDO', 400);
  }
  return email;
}

export class CulqiAdapter implements IPaymentGateway {
  readonly gatewayId = 'culqi' as const;

  async crearIntencionPago(
    monto: number,
    moneda: MonedaPago,
    metadata: PagoMetadata,
  ): Promise<IntencionPagoResult> {
    const pedidoId = resolverPedidoId(metadata);
    const montoSolicitado = monto > 0 ? monto : undefined;

    const montoValidado = await obtenerMontoCobroPedidoDesdeBd(
      BigInt(pedidoId),
      montoSolicitado,
    );

    const currencyCode = normalizeMoneda(moneda || montoValidado.currencyCode);

    let clientData: Record<string, unknown> | undefined;
    try {
      const clientConfig = getCulqiClientConfig();
      clientData = {
        publicKey: clientConfig.publicKey,
        rsaId: clientConfig.rsaId,
        rsaPublicKey: clientConfig.rsaPublicKey,
      };
    } catch {
      clientData = undefined;
    }

    return {
      gateway: this.gatewayId,
      intentId: `culqi-intent-${pedidoId}-${montoValidado.amountCents}`,
      monto: montoValidado.amountSoles,
      moneda: currencyCode || CULQI_DEFAULT_CURRENCY,
      amountCents: montoValidado.amountCents,
      metadata: {
        ...metadata,
        pedido_id: pedidoId,
      },
      clientData,
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
    const paymentSource = token?.trim();

    if (!paymentSource) {
      throw new CulqiPedidoPagoError(
        'Token o source_id de pago requerido',
        'TOKEN_REQUERIDO',
        400,
      );
    }

    const montoValidado = await obtenerMontoCobroPedidoDesdeBd(
      BigInt(pedidoId),
      monto > 0 ? monto : undefined,
    );

    const currencyCode = normalizeMoneda(moneda || montoValidado.currencyCode);

    const culqiResult = await this.ejecutarCargoCulqiApi({
      pedidoId,
      sourceId: paymentSource,
      email,
      amountCents: montoValidado.amountCents,
      currencyCode,
      description: metadata.description,
      pagador: resolverDatosPagador(metadata),
    });

    if (!culqiResult.success || !culqiResult.data) {
      return {
        success: false,
        gateway: this.gatewayId,
        httpStatus: culqiResult.httpStatus,
        message: culqiResult.message,
        code: culqiResult.code,
      };
    }

    const transactionId = culqiResult.data.id;
    if (!transactionId) {
      throw new CulqiPedidoPagoError(
        'Culqi no devolvió ID de transacción',
        'CULQI_SIN_CHARGE_ID',
        502,
      );
    }

    const chargeData = culqiResult.data as CulqiWebhookChargePayload;

    return {
      success: true,
      gateway: this.gatewayId,
      transactionId,
      monto: montoValidado,
      metodoPago: inferirMetodoPagoDesdeCargoCulqi({
        ...chargeData,
        source_id: paymentSource,
      }),
      estadoPago: EstadoPago.pagado,
      gatewayStatus: 'approved',
      rawData: culqiResult.data as CulqiChargeSuccessBody,
      message: culqiResult.message,
      code: culqiResult.code,
    };
  }

  private async ejecutarCargoCulqiApi(input: {
    pedidoId: number;
    sourceId: string;
    email: string;
    amountCents: number;
    currencyCode: CulqiCurrencyCode;
    description?: string;
    pagador?: DatosPagadorCheckout | null;
  }) {
    const secretKey = getCulqiSecretKey();
    const metadataKey = getCulqiWebhookMetadataPedidoKey();
    const culqiMetadata: Record<string, string> = {
      [metadataKey]: String(input.pedidoId),
    };

    if (input.pagador?.pagador_usuario_id) {
      culqiMetadata.usuario_id = String(input.pagador.pagador_usuario_id);
    }

    const response = await fetch(CULQI_CHARGES_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amountCents,
        currency_code: input.currencyCode,
        email: input.email.trim(),
        source_id: input.sourceId,
        metadata: culqiMetadata,
        ...(input.pagador
          ? { antifraud_details: toCulqiAntifraudDetails(input.pagador) }
          : {}),
        ...(input.description ? { description: input.description } : {}),
      }),
    });

    let body: unknown = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }

    return mapCulqiChargeHttpResponse(response.status, body);
  }
}
