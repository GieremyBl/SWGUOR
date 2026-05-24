import { z } from 'zod';

// Tu enum de tipo de evento actual
export const TipoNotificacionEnum = z.enum([
  'stock_bajo',
  'pedido_vencido',
  'pago_pendiente',
  'cotizacion_expirada',
  'orden_produccion',
  'confeccion_completada',
  'devolucion_solicitada',
  'sistema',  
]);

// ¡NUEVO! Sincronizado con el Enum relacional de módulos
export const ReferenciaNotificacionEnum = z.enum([
  'PRODUCTO',
  'COTIZACION',
  'ORDEN_PRODUCCION',
  'PAGO',
  'PEDIDO',
  'SISTEMA'
]);

export const notificacionBaseSchema = z.object({
  id: z.union([z.number(), z.string(), z.bigint()]),
  usuario_id: z.number().int().positive(),
  tipo: TipoNotificacionEnum,
  titulo: z.string().min(1).max(255),
  mensaje: z.string().min(1),
  leido: z.boolean().default(false),
  leido_at: z.coerce.date().nullable().optional(),
  
  // Ahora la columna está blindada y tipada bajo el nuevo Enum
  referencia_tipo: ReferenciaNotificacionEnum.nullable().optional(),
  referencia_id: z.union([z.number(), z.string(), z.bigint()]).nullable().optional(),
  
  url_destino: z.string().nullable().optional(),
  created_at: z.coerce.date(),
});

export const crearNotificacionSchema = notificacionBaseSchema.omit({
  id: true,
  created_at: true,
  leido: true,
  leido_at: true,
});

export type TipoNotificacion = z.infer<typeof TipoNotificacionEnum>;
export type ReferenciaNotificacion = z.infer<typeof ReferenciaNotificacionEnum>;
export type Notificacion = z.infer<typeof notificacionBaseSchema>;
export type CrearNotificacion = z.infer<typeof crearNotificacionSchema>;