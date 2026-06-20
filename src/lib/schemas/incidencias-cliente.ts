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
