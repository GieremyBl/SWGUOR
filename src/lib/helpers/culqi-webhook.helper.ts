import { createHmac, timingSafeEqual } from 'crypto';
import type { MetodoPago } from '@prisma/client';
import {
  CULQI_WEBHOOK_CHARGE_SUCCEEDED_EVENTS,
  getCulqiWebhookMetadataPedidoKey,
  type CulqiWebhookChargeSucceededEvent,
} from '@/lib/constants/culqi-webhook';

export interface CulqiWebhookChargePayload {
  id?: string;
  amount?: number;
  email?: string;
  currency_code?: string;
  source_id?: string;
  metadata?: Record<string, unknown>;
  source?: Record<string, unknown>;
  description?: string;
}

export interface CulqiWebhookEventPayload {
  object?: string;
  type?: string;
  id?: string;
  data?: CulqiWebhookChargePayload;
  creation_date?: number;
}

export function esEventoCargoExitoso(type?: string): type is CulqiWebhookChargeSucceededEvent {
  if (!type) return false;
  return (CULQI_WEBHOOK_CHARGE_SUCCEEDED_EVENTS as readonly string[]).includes(type);
}

export function parseCulqiWebhookBody(rawBody: string): CulqiWebhookEventPayload {
  try {
    return JSON.parse(rawBody) as CulqiWebhookEventPayload;
  } catch {
    throw new CulqiWebhookParseError('Payload JSON inválido');
  }
}

export class CulqiWebhookParseError extends Error {
  readonly code = 'WEBHOOK_PAYLOAD_INVALIDO';

  constructor(message: string) {
    super(message);
    this.name = 'CulqiWebhookParseError';
  }
}

export class CulqiWebhookSignatureError extends Error {
  readonly code = 'WEBHOOK_FIRMA_INVALIDA';

  constructor(message = 'Firma de webhook Culqi inválida') {
    super(message);
    this.name = 'CulqiWebhookSignatureError';
  }
}

/**
 * Verificación opcional HMAC-SHA256 del cuerpo crudo.
 * Header configurable: CULQI_WEBHOOK_SIGNATURE_HEADER (default: x-culqi-signature)
 */
export function verificarFirmaWebhookCulqi(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader?.trim()) return false;

  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const received = signatureHeader.trim().replace(/^sha256=/i, '');

  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(received, 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

export function extraerPedidoIdDesdeCargo(
  charge: CulqiWebhookChargePayload,
): number | null {
  const key = getCulqiWebhookMetadataPedidoKey();
  const metadata = charge.metadata ?? {};

  const candidatos = [
    metadata[key],
    metadata.pedido_id,
    metadata.pedidoId,
    metadata.order_id,
  ];

  for (const raw of candidatos) {
    const id = Number(raw);
    if (Number.isFinite(id) && id > 0) return id;
  }

  return null;
}

export function inferirMetodoPagoDesdeCargoCulqi(
  charge: CulqiWebhookChargePayload,
): MetodoPago {
  const sourceId = String(charge.source_id ?? '');
  if (sourceId === 'bank_transfer') {
    return 'transferencia_bcp';
  }

  const source = charge.source;
  const sourceType = String(source?.type ?? '').toLowerCase();
  if (sourceType.includes('yape')) return 'yape';
  if (sourceType.includes('plin')) return 'plin';

  const iin = source?.iin as Record<string, unknown> | undefined;
  const brand = String(iin?.card_brand ?? source?.brand ?? '').toLowerCase();
  if (brand.includes('master')) return 'mastercard';
  return 'visa';
}

export function isCulqiWebhookParseError(error: unknown): error is CulqiWebhookParseError {
  return error instanceof CulqiWebhookParseError;
}

export function isCulqiWebhookSignatureError(
  error: unknown,
): error is CulqiWebhookSignatureError {
  return error instanceof CulqiWebhookSignatureError;
}
