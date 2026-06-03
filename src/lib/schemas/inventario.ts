import { z } from "zod";
import {
  TipoInsumo,
  CategoriaInsumo,
  UnidadMedida,
  TipoMovimiento,
} from "@prisma/client";

// ── 1. SUB-SCHEMAS ────────────────────────────────────────────────────────────

export const movimientoSchema = z.object({
  cantidad: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  tipo_movimiento: z.enum(TipoMovimiento),
  motivo: z.string().optional().nullable(),
  costo_unitario: z.number().min(0).optional().nullable(),
  referencia_tipo: z
    .enum(["ORDEN", "COMPRA", "AJUSTE", "VENTA"])
    .optional()
    .nullable(),
});

// ── 2. SCHEMA PRINCIPAL ───────────────────────────────────────────────────────

export const insumoSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  tipo: z.enum(TipoInsumo),
  categoria_insumo: z.enum(CategoriaInsumo).default("otro"),
  unidad_medida: z.enum(UnidadMedida).default("unidades"),
  stock_actual: z.number().min(0).default(0),
  stock_minimo: z.number().min(0).default(10),
  stock_maximo: z.number().min(0).optional().nullable(),
  precio_unitario: z.number().min(0).optional().nullable(),
  proveedor_id: z.number().optional().nullable(),
  ubicacion_almacen: z
    .string()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .nullable(),
  alerta_bajo_stock: z.boolean().default(true),
});

export const ajusteStockSchema = z
  .object({
    operacion: z.enum(["sumar", "restar", "absoluto"]),
    cantidad: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
    motivo: z.string().min(3, "Motivo requerido"),
    costo_unitario: z.number().min(0).optional().nullable(),
    referencia_tipo: z
      .enum(["ORDEN", "COMPRA", "AJUSTE", "VENTA"])
      .optional()
      .nullable(),
  })
  .refine(
    (d) => !(d.operacion === "absoluto" && d.cantidad < 0),
    { message: "El stock absoluto no puede ser negativo", path: ["cantidad"] }
  );

// ── 3. OUTPUT SCHEMA (Transformación para la API) ─────────────────────────────

export const insumoOutputSchema = insumoSchema.transform((d) => ({
  nombre: d.nombre,
  tipo: d.tipo,
  categoria_insumo: d.categoria_insumo,
  unidad_medida: d.unidad_medida,
  stock_actual: d.stock_actual,
  stock_minimo: d.stock_minimo,
  stock_maximo: d.stock_maximo ?? null,
  precio_unitario: d.precio_unitario ?? null,
  proveedor_id: d.proveedor_id ? BigInt(d.proveedor_id) : null,
  ubicacion_almacen: d.ubicacion_almacen ?? null,
  alerta_bajo_stock: d.alerta_bajo_stock,
}));

// ── 4. TIPOS ──────────────────────────────────────────────────────────────────

export type InsumoFormValues = z.infer<typeof insumoSchema>;
export type AjusteStockFormValues = z.infer<typeof ajusteStockSchema>;
export type MovimientoFormValues = z.infer<typeof movimientoSchema>;
export type InsumoOutput = z.infer<typeof insumoOutputSchema>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}