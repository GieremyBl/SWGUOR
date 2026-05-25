import { z } from 'zod';
import {
  TIPO_BENEFICIO_OPCIONES,
  TIPO_CONTEO_OPCIONES,
} from '@/lib/constants/promociones';

const tipoBeneficioValues = TIPO_BENEFICIO_OPCIONES.map((o) => o.value) as [
  string,
  ...string[],
];
const tipoConteoValues = TIPO_CONTEO_OPCIONES.map((o) => o.value) as [
  string,
  ...string[],
];

export const reglaVinculoSchema = z.object({
  regla_id: z.union([z.string(), z.number()]),
  prioridad: z.number().int().min(1).max(99).default(1),
});

export const reglaDescuentoSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    nombre: z.string().min(1, 'Nombre obligatorio').max(120),
    cantidad_min: z.coerce.number().int().min(1).default(400),
    monto_min_compra: z.coerce.number().min(0).nullable().optional(),
    tipo_beneficio: z.enum(tipoBeneficioValues),
    valor_descuento: z.coerce.number().min(0).max(100),
    fecha_inicio: z.string().min(1, 'Fecha inicio obligatoria'),
    fecha_fin: z.string().min(1, 'Fecha fin obligatoria'),
    categoria_id: z.union([z.string(), z.number()]).nullable().optional(),
    tipo_conteo: z.enum(tipoConteoValues).nullable().optional(),
    activo: z.boolean().optional().default(true),
  })
  .refine(
    (d) => new Date(d.fecha_fin) >= new Date(d.fecha_inicio),
    { message: 'La fecha fin debe ser posterior o igual a la de inicio', path: ['fecha_fin'] },
  );

export const campanaSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    nombre: z.string().min(1, 'Nombre obligatorio').max(150),
    descripcion: z.string().max(500).nullable().optional(),
    activo: z.boolean().optional().default(true),
    fecha_inicio: z.string().min(1, 'Fecha inicio obligatoria'),
    fecha_fin: z.string().nullable().optional(),
    reglas: z.array(reglaVinculoSchema).default([]),
  })
  .refine(
    (d) => !d.fecha_fin || new Date(d.fecha_fin) >= new Date(d.fecha_inicio),
    { message: 'La fecha fin debe ser posterior o igual a la de inicio', path: ['fecha_fin'] },
  );

export type ReglaDescuentoForm = z.infer<typeof reglaDescuentoSchema>;
export type CampanaForm = z.infer<typeof campanaSchema>;
export type ReglaVinculoForm = z.infer<typeof reglaVinculoSchema>;

export interface ReglaDescuentoRow {
  id: string | number;
  nombre: string;
  cantidad_min: number;
  monto_min_compra: number | null;
  tipo_beneficio: string;
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  categoria_id: string | number | null;
  tipo_conteo: string | null;
  activo: boolean | null;
  categorias?: { id: string | number; nombre: string } | null;
}

export interface CampanaRow {
  id: string | number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fecha_inicio: string;
  fecha_fin: string | null;
  reglas?: Array<{
    regla_id: string | number;
    prioridad: number;
    reglas_descuento?: ReglaDescuentoRow;
  }>;
}

export interface ApiListResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: { total: number; page: number; totalPages: number };
  error?: string;
}

export interface ApiItemResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
