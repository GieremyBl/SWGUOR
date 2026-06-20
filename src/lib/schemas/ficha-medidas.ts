import { z } from 'zod';

export const fichaMedidaItemSchema = z.object({
  id: z.string().optional(),
  id_ficha: z.union([z.string(), z.number()]).optional(),
  punto_medida: z.string().min(1, 'El punto de medida es requerido'),
  talla: z.string().min(1, 'La talla es requerida'),
  valor_cm: z.coerce.number().min(0, 'La medida no puede ser negativa').nullable().optional(),
  tolerancia: z.coerce.number().min(0, 'La tolerancia no puede ser negativa').nullable().optional(),
});

export const fichaMedidasBulkSchema = z.object({
  ficha_id: z.union([z.string(), z.number()]),
  medidas: z.array(fichaMedidaItemSchema).min(1, 'Debe haber al menos una medida'),
});

export const fichaMedidaSingleSchema = z.object({
  ficha_id: z.union([z.string(), z.number()]),
  medida: fichaMedidaItemSchema,
});

export type FichaMedidaItem = z.infer<typeof fichaMedidaItemSchema>;

export interface FichaMedidaRow {
  id: string;
  id_ficha?: string | null;
  punto_medida: string | null;
  talla: string | null;
  valor_cm: number | null;
  tolerancia: number | null;
  created_at?: string;
}
