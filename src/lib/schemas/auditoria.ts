import { z } from 'zod';

export const AccionAuditoriaEnum = z.enum([
  'crear',
  'actualizar',
  'eliminar',
  'aprobar',
  'rechazar',
  'anular',
]);

export const auditoriaBaseSchema = z.object({
  id: z.number().int().positive(),
  usuario_id: z.number().int().positive().nullable().optional(),
  accion: AccionAuditoriaEnum,
  tabla: z.string().max(255),
  registro_id: z.number().int().positive(),
  datos_antes: z.string().nullable().optional(),
  datos_despues: z.string().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  created_at: z.date(),
});

export const obtenerAuditoriaSchema = z.object({
  filtro: z
    .object({
      usuario_id: z.number().int().positive().optional(),
      accion: AccionAuditoriaEnum.optional(),
      tabla: z.string().optional(),
      desde: z.date().optional(),
      hasta: z.date().optional(),
    })
    .optional(),
  paginacion: z
    .object({
      pagina: z.number().int().positive().default(1),
      limite: z.number().int().positive().default(50),
    })
    .optional(),
});

export const reporteAuditoriaSchema = z.object({
  desde: z.date().optional(),
  hasta: z.date().optional(),
  usuario_id: z.number().int().positive().optional(),
  tabla: z.string().optional(),
  agrupar_por: z.enum(['usuario_id', 'tabla', 'accion', 'dia']).optional(),
});

export type AccionAuditoria = z.infer<typeof AccionAuditoriaEnum>;
export type Auditoria = z.infer<typeof auditoriaBaseSchema>;
export type ObtenerAuditoria = z.infer<typeof obtenerAuditoriaSchema>;