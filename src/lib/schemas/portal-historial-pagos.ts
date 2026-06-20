import { z } from 'zod';
import { abonoPedidoSchema } from '@/lib/schemas/portal-pedido-pagos';

export const historialPagoComprobanteSchema = z.object({
  id: z.string().uuid(),
  numero_completo: z.string().nullable(),
  serie: z.string(),
  correlativo: z.string(),
  tipo: z.string(),
});

export const historialPagoFilaSchema = z.object({
  pedido_id: z.number().int().positive(),
  codigo: z.string(),
  estado_pedido: z.string(),
  estado_pago: z.enum(['pendiente', 'parcial', 'pagado']),
  fecha: z.string(),
  monto_total: z.number(),
  monto_pagado: z.number(),
  saldo_pendiente: z.number(),
  moneda: z.string(),
  total_unidades: z.number().int().nonnegative(),
  comprobante: historialPagoComprobanteSchema.nullable(),
  pago_id: z.string().uuid().nullable(),
  abonos: z.array(abonoPedidoSchema),
});

export type HistorialPagoFila = z.infer<typeof historialPagoFilaSchema>;

export interface HistorialPagosResponse {
  success: true;
  data: HistorialPagoFila[];
}
