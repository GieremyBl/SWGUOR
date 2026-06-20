import { z } from 'zod';
import {
  SEVERIDADES_INCIDENCIA_TALLER,
  TIPOS_INCIDENCIA_TALLER,
} from '@/lib/constants/incidencias-taller';

export const TipoIncidenciaTallerEnum = z.enum(TIPOS_INCIDENCIA_TALLER);
export const SeveridadIncidenciaTallerEnum = z.enum(SEVERIDADES_INCIDENCIA_TALLER);

export const crearIncidenciaTallerSchema = z.object({
  confeccion_id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  tipo: TipoIncidenciaTallerEnum,
  severidad: SeveridadIncidenciaTallerEnum.default('media'),
  descripcion: z.string().trim().min(10, 'Describe la incidencia con al menos 10 caracteres').max(2000),
  asignado_a: z.union([z.number(), z.string()]).transform((v) => String(v)).optional(),
  impacto_horas: z.number().min(0).max(9999).optional(),
  foto_url: z.string().url().max(500).optional().or(z.literal('')),
});

export const resolverIncidenciaTallerSchema = z.object({
  solucion: z.string().trim().min(5, 'La solución debe tener al menos 5 caracteres').max(2000),
  impacto_horas: z.number().min(0).max(9999).optional(),
});

export const asignarIncidenciaTallerSchema = z.object({
  asignado_a: z.union([z.number(), z.string()]).transform((v) => String(v)),
});

export const editarIncidenciaTallerSchema = z.object({
  tipo: TipoIncidenciaTallerEnum.optional(),
  severidad: SeveridadIncidenciaTallerEnum.optional(),
  descripcion: z.string().trim().min(10).max(2000).optional(),
  impacto_horas: z.number().min(0).max(9999).nullable().optional(),
  foto_url: z.string().url().max(500).nullable().optional().or(z.literal('')),
});

export type CrearIncidenciaTallerInput = z.infer<typeof crearIncidenciaTallerSchema>;
export type ResolverIncidenciaTallerInput = z.infer<typeof resolverIncidenciaTallerSchema>;
export type AsignarIncidenciaTallerInput = z.infer<typeof asignarIncidenciaTallerSchema>;
export type EditarIncidenciaTallerInput = z.infer<typeof editarIncidenciaTallerSchema>;

export interface IncidenciaTallerFila {
  id: number | string;
  pedido_id: number | string;
  confeccion_id: number | string | null;
  tipo: z.infer<typeof TipoIncidenciaTallerEnum>;
  severidad: z.infer<typeof SeveridadIncidenciaTallerEnum>;
  descripcion: string;
  reportado_por: number | string | null;
  asignado_a: number | string | null;
  fecha_reporte: string;
  fecha_resolucion: string | null;
  resuelto: boolean;
  solucion: string | null;
  impacto_horas: number | null;
  foto_url: string | null;
  created_at: string;
  updated_at: string | null;
  confecciones?: {
    id?: number | string;
    prenda?: string | null;
    talleres?: { id?: number | string; nombre?: string | null } | null;
  } | null;
  pedidos?: { id?: number | string } | null;
  usuario_reportador?: { id?: number | string; email?: string | null } | null;
  usuario_asignado?: { id?: number | string; email?: string | null } | null;
}

export interface IncidenciasTallerListResponse {
  data: IncidenciaTallerFila[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
