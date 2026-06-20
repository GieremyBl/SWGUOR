import { z } from 'zod';

export const abonoPedidoComprobanteSchema = z.object({
  id: z.string().uuid(),
  numero_completo: z.string().nullable(),
});

export const abonoPedidoSchema = z.object({
  id: z.string().uuid(),
  monto: z.number(),
  estado: z.enum(['pendiente', 'pago_parcial', 'pagado', 'anulado']),
  fecha_pago: z.string(),
  tipo: z.string(),
  metodo_pago: z.string(),
  comprobante: abonoPedidoComprobanteSchema.nullable(),
});

export const pedidoPagosResumenSchema = z.object({
  pedido_id: z.number().int().positive(),
  monto_total: z.number(),
  monto_pagado: z.number(),
  saldo_pendiente: z.number(),
  moneda: z.string(),
  abonos: z.array(abonoPedidoSchema),
});

export type AbonoPedido = z.infer<typeof abonoPedidoSchema>;
export type PedidoPagosResumen = z.infer<typeof pedidoPagosResumenSchema>;
