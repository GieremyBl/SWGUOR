import { z } from 'zod';

export const fichaDetalleItemSchema = z.object({
  id: z.string().optional(),
  ficha_id: z.string().or(z.number()).optional(),
  material_id: z.union([z.string(), z.number()]).nullable().optional(),
  insumo_id: z.union([z.string(), z.number()]).nullable().optional(),
  cantidad_consumo: z
    .number({ message: 'La cantidad debe ser un número' })
    .min(0.0001, 'La cantidad debe ser mayor a 0'),
  porcentaje_desperdicio: z.number().min(0).max(100).default(0),
  observaciones: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
}).refine(
  (data) => {
    const tieneMaterial = data.material_id != null && data.material_id !== '';
    const tieneInsumo = data.insumo_id != null && data.insumo_id !== '';
    return tieneMaterial !== tieneInsumo;
  },
  {
    message: 'Debe seleccionar un material o un insumo, pero no ambos.',
    path: ['material_id'],
  },
);

export const fichaDetalleBulkSchema = z.object({
  ficha_id: z.union([z.string(), z.number()]),
  items: z.array(fichaDetalleItemSchema),
});

export const fichaDetalleSingleSchema = z.object({
  ficha_id: z.union([z.string(), z.number()]),
  item: fichaDetalleItemSchema,
});

export type FichaDetalleItem = z.infer<typeof fichaDetalleItemSchema>;

export interface FichaDetalleItemRef {
  id: string;
  nombre: string;
  tipo: string;
  composicion?: string | null;
  color?: string | null;
  unidad_medida: string;
  precio_unitario: number | string;
}

export interface FichaDetalleRow {
  id: string;
  ficha_id: string;
  material_id?: string | null;
  insumo_id?: string | null;
  cantidad_consumo: number | string;
  porcentaje_desperdicio?: number | string | null;
  observaciones?: string | null;
  materiales?: FichaDetalleItemRef | null;
  insumo?: FichaDetalleItemRef | null;
}
