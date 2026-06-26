import { z } from 'zod';

export const TipoIncidenciaClienteEnum = z.enum([
  'defecto_confeccion',
  'pedido_equivocado',
  'talla_incorrecta',
  'cantidad_incorrecta',
  'dano_en_transporte',
  'empaque_defectuoso',
  'otro',
]);

export const EstadoIncidenciaClienteEnum = z.enum([
  'abierta',
  'en_revision',
  'resuelta',
  'cerrada',
]);
export const severidadSchema = z.enum(['baja', 'media', 'alta', 'critica']);

// ─── Schema del formulario (client-side) ─────────────────────────────────────
export const incidenciaFormSchema = z.object({
  tipo: TipoIncidenciaClienteEnum,
  severidad: severidadSchema,
  descripcion: z
    .string()
    .min(10, 'Describe el problema con al menos 10 caracteres.')
    .max(1000, 'Máximo 1000 caracteres.'),
  foto: z
    .instanceof(File)
    .refine((f) => f.size <= 5 * 1024 * 1024, 'La foto no debe superar 5 MB.')
    .refine(
      (f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
      'Solo se aceptan imágenes JPG, PNG o WEBP.',
    )
    .optional()
    .nullable(),
});

export type IncidenciaFormValues = z.infer<typeof incidenciaFormSchema>;

// ─── Schema del payload hacia Supabase (server) ───────────────────────────────
export const createIncidenciaSchema = z.object({
  pedido_id: z.number().int().positive(),
  tipo: incidenciaFormSchema.shape.tipo,
  severidad: incidenciaFormSchema.shape.severidad,
  descripcion: incidenciaFormSchema.shape.descripcion,
  evidencia_url: z.array(z.string().url()).default([]),
});

export type CreateIncidenciaInput = z.infer<typeof createIncidenciaSchema>;

// ─── Schema para validar update de tracking (posición GPS) ───────────────────
export const updatePosicionSchema = z.object({
  despacho_id: z.number().int().positive(),
  pos_actual_lat: z.number().min(-90).max(90),
  pos_actual_lng: z.number().min(-180).max(180),
  distancia_km: z.number().nonnegative().optional(),
  tiempo_min: z.number().int().nonnegative().optional(),
});

export type UpdatePosicionInput = z.infer<typeof updatePosicionSchema>;
export type CrearIncidenciaClienteInput = z.infer<typeof crearIncidenciaClienteSchema>;
export type ResponderIncidenciaClienteInput = z.infer<typeof responderIncidenciaClienteSchema>;

export interface IncidenciaClienteFila {
  id: number | string;
  cliente_id: number | string | null;
  pedido_id: number | string | null;
  tipo: z.infer<typeof TipoIncidenciaClienteEnum> | null;
  descripcion: string | null;
  estado: string | null;
  evidencia_url: string[];
  created_at: string | null;
  updated_at: string | null;
  cliente?: {
    id?: number | string;
    razon_social?: string | null;
    nombre_comercial?: string | null;
    ruc?: string | null;
    email?: string | null;
  } | null;
  pedido?: { id?: number | string; estado?: string | null } | null;
}

export const crearIncidenciaClienteSchema = z.object({
  pedido_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  tipo: TipoIncidenciaClienteEnum,
  descripcion: z.string().trim().min(10, 'Describe el problema con al menos 10 caracteres').max(2000),
  evidencia_url: z.array(z.string().url()).max(5).optional().default([]),
});

export const responderIncidenciaClienteSchema = z.object({
  estado: EstadoIncidenciaClienteEnum.refine((e) => e !== 'abierta', {
    message: 'Selecciona un estado de respuesta válido',
  }),
  respuesta_soporte: z.string().trim().min(5, 'La respuesta debe tener al menos 5 caracteres').max(2000),
});

