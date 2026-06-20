import { z } from 'zod';

export const ordenProduccionItemSchema = z.object({
  pedido_item_id: z.coerce.number().min(1, 'Ítem de pedido requerido'),
  producto_id: z.coerce.number().min(1, 'Producto requerido'),
  variante_id: z.coerce.number().nullable().optional(),
  cantidad: z.coerce.number().int().min(1, 'Mínimo 1 unidad'),
});

export const ordenProduccionItemCreateSchema = ordenProduccionItemSchema.extend({
  orden_produccion_id: z.coerce.number().min(1, 'Orden de producción requerida'),
});

export const ordenProduccionItemUpdateSchema = ordenProduccionItemSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Sin cambios' });

export type OrdenProduccionItemPayload = z.infer<typeof ordenProduccionItemSchema>;

export interface OrdenProduccionItemRow {
  id: string | number;
  orden_produccion_id: string | number;
  pedido_item_id: string | number;
  producto_id: string | number;
  variante_id?: string | number | null;
  cantidad: number;
  created_at?: string;
  updated_at?: string;
  pedido_items?: {
    id: string | number;
    cantidad: number;
    talla?: string | null;
    color?: string | null;
  };
  productos?: {
    id: string | number;
    nombre: string;
    sku?: string | null;
  };
  variantes_producto?: {
    id: string | number;
    talla?: string | null;
    color?: string | null;
  } | null;
}
