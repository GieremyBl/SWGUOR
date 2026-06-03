import { z } from 'zod';

export const ESPECIALIDADES_TALLER = [
  'costura',
  'bordado',
  'estampado',
  'acabados',
  'corte',
  'confeccion',
  'otro',
] as const;

export const ESTADOS_TALLER = ['activo', 'inactivo', 'suspendido'] as const;

export const tallerSchema = z.object({
  id:           z.string().optional(),
  nombre:       z.string().min(1, 'El nombre es obligatorio'),
  ruc:          z.string().regex(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos numéricos'),
  contacto:     z.string().min(1, 'El nombre de contacto es obligatorio'),
  telefono:     z.string().min(1, 'El teléfono es obligatorio'),
  email:        z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().email('Formato de email inválido').optional()
  ),
  direccion:    z.string().min(1, 'La dirección es obligatoria'),
  especialidad: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(ESPECIALIDADES_TALLER).optional()
  ),
  estado:       z.enum(ESTADOS_TALLER).default('activo'),
});

export type TallerForm = z.infer<typeof tallerSchema>;

export type Taller = TallerForm & {
  created_at: string;
  updated_at?: string;
  _count?:     { confecciones: number };
};

export type EstadoTaller = typeof ESTADOS_TALLER[number] | 'todos';

export interface ApiResponse<T = unknown> {
  success:  boolean;
  data?:    T;
  error?:   string;
  message?: string;
}