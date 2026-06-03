import { z } from 'zod';

// ── Enums ────────────────────────────────────────────────────────────────────

export const TIPOS_MATERIAL    = ['plano', 'punto', 'tejido', 'especial'] as const;
export const UNIDADES_MATERIAL = ['metros', 'kilos', 'yards', 'unidades'] as const;
export const OPERACIONES_STOCK = ['sumar', 'restar', 'absoluto']          as const;

// ── Interfaces de dominio ────────────────────────────────────────────────────

export interface MaterialCatalogo {
  id:     number;
  nombre: string;
}

export interface Material {
  id:                 number;
  nombre:             string;
  tipo:               typeof TIPOS_MATERIAL[number];
  descripcion?:       string | null;
  composicion?:       string | null;
  gramaje?:           number | null;
  ancho_total?:       number | null;
  ancho_util?:        number | null;
  color?:             string | null;
  codigo_color?:      string | null;
  unidad_medida:      typeof UNIDADES_MATERIAL[number];
  stock_actual:       number;
  stock_minimo:       number;
  precio_unitario?:   number | null;
  ubicacion_almacen?: string | null;
  alerta_bajo_stock:  boolean;
  createdAt:          string;
  updatedAt:          string;
}

// ── Zod: Crear / Editar material ─────────────────────────────────────────────

export const materialSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(120, 'Máximo 120 caracteres'),

  // ✅ CORRECCIÓN ENUMS: El mensaje se pasa directamente mediante la propiedad { message }
  tipo: z.enum(TIPOS_MATERIAL, {
    message: 'Tipo inválido',
  }),

  descripcion: z.string().max(500).optional().nullable(),
  composicion: z.string().max(200).optional().nullable(),

  // ✅ CORRECCIÓN NUMBERS: 'invalid_type_error' se reemplaza usando el objeto { message } dentro de z.number()
  gramaje: z.number({ message: 'Debe ser un número' })
    .int('El gramaje debe ser un número entero')
    .positive('Debe ser mayor a 0')
    .optional()
    .nullable(),

  ancho_total: z.number({ message: 'Debe ser un número' })
    .positive('Debe ser mayor a 0')
    .max(999.99, 'El ancho total no puede exceder los 999.99 cm/m')
    .optional()
    .nullable(),

  ancho_util: z.number({ message: 'Debe ser un número' })
    .positive('Debe ser mayor a 0')
    .max(999.99, 'El ancho útil no puede exceder los 999.99 cm/m')
    .optional()
    .nullable(),

  color:        z.string().max(80).optional().nullable(),
  codigo_color: z.string().max(20).optional().nullable(),

  unidad_medida: z.enum(UNIDADES_MATERIAL, {
    message: 'Unidad inválida',
  }),

  stock_minimo: z.number({ message: 'Debe ser un número' })
    .nonnegative('No puede ser negativo')
    .max(9999999999.99, 'Excede el stock límite de almacenamiento')
    .default(10),

  precio_unitario: z.number({ message: 'Debe ser un número' })
    .nonnegative('No puede ser negativo')
    .max(99999999.99, 'El precio unitario excede el límite permitido')
    .optional()
    .nullable(),

  proveedor_id: z.number().positive().optional().nullable(),
  almacen_id:   z.number().positive().optional().nullable(),
  ubicacion_almacen: z.string().max(100).optional().nullable(),
  alerta_bajo_stock: z.boolean().default(true),
});

// ── Zod: Ajuste de stock ─────────────────────────────────────────────────────

export const ajustarStockSchema = z.object({
  id: z.string().min(1),

  operacion: z.enum(OPERACIONES_STOCK, {
    message: 'Operación inválida',
  }),

  cantidad: z.number({ message: 'Debe ser un número' })
    .positive('Debe ser mayor a 0'),

  motivo: z.string().max(200).optional(),
});

// ── Types inferidos desde Zod ────────────────────────────────────────────────

export type MaterialFormValues   = z.infer<typeof materialSchema>;
export type AjustarStockValues   = z.infer<typeof ajustarStockSchema>;
export type TipoMaterial         = typeof TIPOS_MATERIAL[number];
export type UnidadMaterial       = typeof UNIDADES_MATERIAL[number];
export type OperacionStock       = typeof OPERACIONES_STOCK[number];