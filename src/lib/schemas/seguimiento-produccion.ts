import { z } from 'zod';
import { ETAPAS_PRODUCCION } from '@/lib/schemas/ordenes-produccion';

export const registrarEtapaSchema = z.object({
  orden_id: z.coerce.number().min(1, 'orden_id requerido'),
  etapa: z.enum(ETAPAS_PRODUCCION),
  observaciones: z.string().optional(),
});

export const actualizarSeguimientoSchema = z.object({
  observaciones: z.string().nullable().optional(),
});

export type RegistrarEtapaPayload = z.infer<typeof registrarEtapaSchema>;

export interface SeguimientoProduccionRow {
  id: string | number;
  orden_id: string | number;
  etapa: string;
  iniciado_en?: string;
  completado_en?: string | null;
  duracion_minutos?: number | null;
  usuario_id?: string | number | null;
  observaciones?: string | null;
  activo: boolean;
  created_at: string;
  usuarios?: {
    id: string | number;
    email?: string | null;
    rol?: string | null;
  } | null;
}
