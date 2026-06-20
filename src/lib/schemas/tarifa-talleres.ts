import { z } from 'zod';
import { ESPECIALIDADES_TALLER } from '@/lib/schemas/talleres';

export const MONEDAS_TARIFA = ['PEN', 'USD'] as const;

export const tarifaTallerSchema = z.object({
  taller_id: z.coerce.number().min(1, 'Taller requerido'),
  especialidad: z.enum(ESPECIALIDADES_TALLER),
  precio_unitario: z.coerce.number().positive('El precio debe ser mayor a 0'),
  moneda: z.enum(MONEDAS_TARIFA).default('PEN'),
  vigente_desde: z.string().optional(),
  vigente_hasta: z.string().nullable().optional(),
  activo: z.boolean().default(true),
  notas: z.string().nullable().optional(),
});

export const tarifaTallerUpdateSchema = tarifaTallerSchema
  .omit({ taller_id: true })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Sin cambios' });

export const calcularCostoTarifaSchema = z.object({
  cantidad: z.coerce.number().positive('Cantidad debe ser mayor a 0'),
});

export type TarifaTallerForm = z.infer<typeof tarifaTallerSchema>;
export type TarifaTallerUpdate = z.infer<typeof tarifaTallerUpdateSchema>;

export interface TarifaTallerRow {
  id: string | number;
  taller_id: string | number;
  especialidad: string;
  precio_unitario: string | number;
  moneda: string;
  vigente_desde: string;
  vigente_hasta?: string | null;
  activo: boolean;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
  talleres?: {
    id: string | number;
    nombre: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
