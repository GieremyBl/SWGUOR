import type { MetodoPago } from '@prisma/client';

/** Eventos Culqi que confirman un cargo exitoso (async) */
export const CULQI_WEBHOOK_CHARGE_SUCCEEDED_EVENTS = [
  'charge.succeeded',
  'charge.creation.succeeded',
] as const;

export type CulqiWebhookChargeSucceededEvent =
  (typeof CULQI_WEBHOOK_CHARGE_SUCCEEDED_EVENTS)[number];

export const CODIGO_WEBHOOK_PROCESADO = 'WEBHOOK_PROCESADO';
export const CODIGO_WEBHOOK_DUPLICADO = 'WEBHOOK_DUPLICADO';
export const CODIGO_WEBHOOK_PEDIDO_YA_PAGADO = 'WEBHOOK_PEDIDO_YA_PAGADO';
export const CODIGO_WEBHOOK_EVENTO_IGNORADO = 'WEBHOOK_EVENTO_IGNORADO';

export function getCulqiWebhookSecret(): string | undefined {
  return process.env.CULQI_WEBHOOK_SECRET?.trim() || undefined;
}

export function getCulqiWebhookMetadataPedidoKey(): string {
  return process.env.CULQI_WEBHOOK_PEDIDO_METADATA_KEY?.trim() || 'pedido_id';
}
