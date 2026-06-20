import { prisma } from '@/lib/prisma';
import {
  CODIGO_WEBHOOK_DUPLICADO,
  CODIGO_WEBHOOK_PEDIDO_YA_PAGADO,
  CODIGO_WEBHOOK_PROCESADO,
} from '@/lib/constants/culqi-webhook';
import {
  extraerPedidoIdDesdeCargo,
  inferirMetodoPagoDesdeCargoCulqi,
  type CulqiWebhookChargePayload,
  type CulqiWebhookEventPayload,
} from '@/lib/helpers/culqi-webhook.helper';
import {
  ejecutarCierreVentaPostCulqi,
  isCierreVentaCulqiError,
} from '@/lib/services/cierre-venta-culqi.service';
import { obtenerMontoCobroPedidoDesdeBd } from '@/lib/services/payments/payment-order-amount.service';
import {
  existePagoPorCulqiChargeId,
  isPagoIdempotenciaError,
  PedidoYaPagadoError,
  validarIdempotenciaPagoPedido,
} from '@/lib/services/pago-idempotencia.service';

export class CulqiWebhookProcesamientoError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'CulqiWebhookProcesamientoError';
    this.code = code;
    this.status = status;
  }
}

export interface ProcesarWebhookCulqiResult {
  success: true;
  code: string;
  message: string;
  data?: {
    pedido_id?: number;
    pago_id?: string;
    comprobante_id?: string;
    culqi_charge_id?: string;
  };
}

function validarMontoCargoVsBd(
  montoBdSoles: number,
  amountCents?: number,
): void {
  if (amountCents == null || !Number.isFinite(amountCents)) return;

  const montoCulqiSoles = amountCents / 100;
  const diff = Math.abs(montoBdSoles - montoCulqiSoles);
  if (diff > 0.01) {
    throw new CulqiWebhookProcesamientoError(
      'El monto del cargo Culqi no coincide con el saldo del pedido',
      'WEBHOOK_MONTO_INCONSISTENTE',
      422,
    );
  }
}

/**
 * Respaldo async: persiste pago + pedido + comprobante si el checkout no completó en el cliente.
 * Idempotente por charge_id y por estado del pedido.
 */
export async function procesarWebhookChargeSucceeded(
  event: CulqiWebhookEventPayload,
): Promise<ProcesarWebhookCulqiResult> {
  const charge = event.data;
  if (!charge?.id) {
    throw new CulqiWebhookProcesamientoError(
      'Evento charge.succeeded sin datos de cargo',
      'WEBHOOK_CARGO_INVALIDO',
    );
  }

  const culqiChargeId = charge.id.trim();
  const pedidoId = extraerPedidoIdDesdeCargo(charge);

  if (!pedidoId) {
    throw new CulqiWebhookProcesamientoError(
      'No se encontró pedido_id en metadata del cargo Culqi',
      'WEBHOOK_PEDIDO_NO_IDENTIFICADO',
    );
  }

  if (await existePagoPorCulqiChargeId(prisma, culqiChargeId)) {
    return {
      success: true,
      code: CODIGO_WEBHOOK_DUPLICADO,
      message: 'Cargo Culqi ya registrado (idempotencia webhook)',
      data: { pedido_id: pedidoId, culqi_charge_id: culqiChargeId },
    };
  }

  try {
    await validarIdempotenciaPagoPedido(pedidoId);
  } catch (error) {
    if (error instanceof PedidoYaPagadoError) {
      return {
        success: true,
        code: CODIGO_WEBHOOK_PEDIDO_YA_PAGADO,
        message: error.message,
        data: { pedido_id: pedidoId, culqi_charge_id: culqiChargeId },
      };
    }
    throw error;
  }

  const monto = await obtenerMontoCobroPedidoDesdeBd(BigInt(pedidoId));
  validarMontoCargoVsBd(monto.amountSoles, charge.amount);

  const metodoPago = inferirMetodoPagoDesdeCargoCulqi(charge);

  const cierre = await ejecutarCierreVentaPostCulqi({
    pedidoId,
    monto: monto.amountSoles,
    metodoPago,
    culqiChargeId,
  });

  return {
    success: true,
    code: CODIGO_WEBHOOK_PROCESADO,
    message: 'Cierre de venta aplicado vía webhook Culqi',
    data: {
      pedido_id: pedidoId,
      culqi_charge_id: culqiChargeId,
      pago_id: cierre.pago.id_uuid,
      comprobante_id: cierre.comprobante.id_uuid,
    },
  };
}

export function isCulqiWebhookProcesamientoError(
  error: unknown,
): error is CulqiWebhookProcesamientoError {
  return error instanceof CulqiWebhookProcesamientoError;
}

export function mapWebhookProcesamientoError(error: unknown): {
  status: number;
  code: string;
  message: string;
} {
  if (isCulqiWebhookProcesamientoError(error)) {
    return { status: error.status, code: error.code, message: error.message };
  }

  if (isPagoIdempotenciaError(error)) {
    return { status: error.status, code: error.code, message: error.message };
  }

  if (isCierreVentaCulqiError(error)) {
    return { status: error.status, code: error.code, message: error.message };
  }

  return {
    status: 500,
    code: 'WEBHOOK_ERROR_INTERNO',
    message: error instanceof Error ? error.message : 'Error interno del webhook',
  };
}
