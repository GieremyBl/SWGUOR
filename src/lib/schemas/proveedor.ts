import { z } from 'zod';

// Lista de sugerencias para el UI — no es un enum en DB (campo String libre)
export const CATEGORIAS_SUMINISTRO = [
  'Telas', 'Avíos', 'Empaque', 'Hilos',
  'Etiquetas', 'Forro', 'Maquinaria', 'Otros',
] as const;

export const proveedorSchema = z.object({
  id:                   z.string().optional(),
  ruc:                  z.string().regex(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos numéricos'),
  razon_social:         z.string().min(1, 'La razón social es obligatoria').max(200),
  contacto:             z.string().min(1, 'El nombre de contacto es obligatorio').max(150),
  telefono:             z.string().min(1, 'El teléfono es obligatorio').max(20),
  email:                z.string().email('Formato de email inválido').max(150),  // obligatorio en DB
  direccion:            z.string().min(1, 'La dirección es obligatoria').max(255),
  categoria_suministro: z.string().min(1, 'La categoría de suministro es obligatoria').max(100),
});

export type ProveedorForm = z.infer<typeof proveedorSchema>;

export type Proveedor = ProveedorForm & {
  estado:     'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
  _count?:    { insumos: number; ordenes_compra: number };
};

export type EstadoProveedor = 'activo' | 'inactivo' | '';

export interface ApiResponse<T = unknown> {
  success:     boolean;
  data:        T;
  pagination?: { total: number; page: number; totalPages: number };
  error?:      string;
  message?:    string;
}
