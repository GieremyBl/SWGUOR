import { z } from 'zod';
import { ESTADO_CONFECCION } from '@/lib/schemas/confecciones';

export const registrarSeguimientoConfeccionSchema = z.object({
  confeccion_id: z.coerce.number().min(1, 'confeccion_id requerido'),
  estado_nuevo: z.enum(ESTADO_CONFECCION),
  estado_anterior: z.enum(ESTADO_CONFECCION).optional(),
  notas: z.string().nullable().optional(),
});

export const actualizarSeguimientoConfeccionSchema = z.object({
  notas: z.string().nullable().optional(),
});

export type RegistrarSeguimientoConfeccionPayload = z.infer<typeof registrarSeguimientoConfeccionSchema>;

export interface SeguimientoConfeccionRow {
  id: string | number;
  confeccion_id?: string | number | null;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
  notas?: string | null;
  responsable_id?: string | number | null;
  created_at?: string | null;
  usuarios?: {
    id: string | number;
    email?: string | null;
    rol?: string | null;
  } | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
