import { z } from 'zod';

const direccionClienteCamposSchema = z.object({
  alias: z.string().trim().min(1, 'El alias es obligatorio').max(100),
  direccion: z.string().trim().min(1, 'La dirección es obligatoria').max(500),
  ciudad: z.string().trim().max(100).optional().nullable(),
  departamento: z.string().trim().max(100).optional().nullable(),
  provincia: z.string().trim().max(100).optional().nullable(),
  pais: z.string().trim().max(100).optional().nullable(),
  es_principal: z.boolean().optional().default(false),
});

export const direccionClienteCreateSchema = direccionClienteCamposSchema;

export const direccionClienteUpdateSchema = direccionClienteCamposSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe enviar al menos un campo para actualizar' },
);

export type DireccionClienteCreateInput = z.infer<typeof direccionClienteCreateSchema>;
export type DireccionClienteUpdateInput = z.infer<typeof direccionClienteUpdateSchema>;

export interface DireccionClienteRecord {
  id: string;
  cliente_id: string;
  alias: string;
  direccion: string;
  ciudad: string | null;
  departamento: string | null;
  provincia: string | null;
  pais: string | null;
  es_principal: boolean;
  created_at: string | null;
}
