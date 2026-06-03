import { z } from "zod";
import {ColorPrenda, EstadoProducto, TallaProductos, TipoBeneficio, TipoConteo, EstadoFicha} from '@prisma/client';

// ── 3. SUB-SCHEMAS (Componentes del Formulario) ──────────────────────────────

export const varianteSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  color: z.enum(ColorPrenda),
  talla: z.enum(TallaProductos),
  precio_adicional: z.number().min(0).default(0),
  stock: z.number().min(0).default(0),
  sku: z.string().min(2, "SKU requerido").toUpperCase(),
  imagen_url: z.string().url("URL inválida").optional().or(z.literal("")),
  estado: z.enum(EstadoProducto).default("activo"),
});

export const reglaDescuentoSchema = z.object({
  nombre: z.string().min(3, "Nombre requerido"),
  cantidad_min: z.number().min(1, "Mínimo 1 unidad").default(400),
  monto_min_compra: z.number().min(0).optional(),
  tipo_beneficio: z.enum(TipoBeneficio),
  valor_descuento: z.number().min(0.01, "Valor requerido"),
  fecha_inicio: z.string().min(1, "Fecha inicio requerida"),
  fecha_fin: z.string().min(1, "Fecha fin requerida"),
  activo: z.boolean().default(true),
  tipo_conteo: z.enum(TipoConteo),
}).refine(
  (d) => new Date(d.fecha_fin) > new Date(d.fecha_inicio),
  { message: "La fecha fin debe ser posterior", path: ["fecha_fin"] }
);

// ── 4. SCHEMA PRINCIPAL (Formulario Único) ───────────────────────────────────

export const productoSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres"),
  sku: z.string().min(2, "SKU maestro").toUpperCase(),
  descripcion: z.string().optional().nullable(),
  precio: z.number().min(0.01),
  stock: z.number().min(0).default(0),
  estado: z.enum(EstadoProducto).default("activo"),
  destacado: z.boolean().default(false),
  categoria_id: z.number().nullable(),
  moq: z.number().default(400),
  imagen: z.string().optional().nullable(),
  ficha_url: z.string().optional().nullable(),
  fichas_tecnicas_id: z.number().nullable().optional(),

  variantes: z.array(varianteSchema).min(1, "Agrega una variante"),
  
  ficha_tecnica: z.object({
    materiales: z.array(z.string()).default([]),
    medidas: z.record(z.string(), z.string()).default({}),
    instructions: z.string().default(""),
  }),

  ficha: z.object({
    version: z.string().default("1.0"),
    descripcion_detallada: z.string().optional(),
    sam_total: z.number().optional(),
    costo_estimado: z.number().optional(),
    imagen_geometral: z.string().optional().or(z.literal("")),
    estado: z.enum(EstadoFicha).default("borrador"),
  }).optional(),

  reglas: z.array(reglaDescuentoSchema).default([]),

  colores_disponibles: z.array(z.enum(ColorPrenda)).default([]),
  tallas_disponibles: z.array(z.enum(TallaProductos)).default([]),
});

// Tipos para el Frontend
export type ProductoFormValues = z.infer<typeof productoSchema>;
export type VarianteFormValues = z.infer<typeof varianteSchema>;
export type ReglaFormValues = z.infer<typeof reglaDescuentoSchema>;

// ── 5. OUTPUT SCHEMA (Transformación para Backend/Supabase) ──────────────────

export const productoOutputSchema = productoSchema.transform((d) => ({
  producto: {
    nombre: d.nombre,
    sku: d.sku,
    descripcion: d.descripcion || null,
    precio: d.precio,
    moq: d.moq,
    stock: d.stock,
    estado: d.estado,
    destacado: d.destacado,
    categoria_id: d.categoria_id ? BigInt(d.categoria_id) : null,
    imagen: d.imagen || null,
    ficha_url: d.ficha_url || null,
    // JSONB: Ficha técnica detallada (instrucciones, etc)
    ficha_tecnica: d.ficha_tecnica, 
    // JSONB: Reglas de descuento integradas
    reglas_descuento: d.reglas.map((r) => ({
      ...r,
      fecha_inicio: new Date(r.fecha_inicio).toISOString(),
      fecha_fin: new Date(r.fecha_fin).toISOString(),
    })),
    colores_disponibles: d.colores_disponibles,
    tallas_disponibles: d.tallas_disponibles,
    // El ID de la ficha externa (si ya existe)
    fichas_tecnicas_id: d.fichas_tecnicas_id ? BigInt(d.fichas_tecnicas_id) : null,
  },
  // Datos para crear una nueva ficha si d.fichas_tecnicas_id es null
  nueva_ficha_relacional: d.ficha ? {
    ...d.ficha,
    imagen_geometral: d.ficha.imagen_geometral || null,
  } : null,
  // Array para inserción en tabla independiente
  variantes: d.variantes.map((v) => ({
    nombre: v.nombre,
    color: v.color,
    talla: v.talla,
    sku: v.sku.toUpperCase(),
    precio_adicional: v.precio_adicional,
    stock: v.stock,
    imagen_url: v.imagen_url || null,
    estado: v.estado,
  })),
}));

export interface ApiResponse<T = unknown> {
  success:  boolean;
  data?:    T;
  error?:   string;
  message?: string;
}

export type ProductoOutput = z.infer<typeof productoOutputSchema>;