/**
 * Schemas Zod - Validaciones de datos para operaciones RPC y API
 * Complementa los RPC con validaciones del lado de cliente/servidor
 */

import { z } from "zod";

// ============================================================================
// ENUMS Y TIPOS BASE
// ============================================================================

export const TipoMovimientoEnum = z.enum(["entrada", "salida", "ajuste"]);
export const ReferenciaMovimientoEnum = z.enum([
  "ORDEN_COMPRA",
  "PEDIDO_CLIENTE",
  "ORDEN_PRODUCCION",
  "AJUSTE_MANUAL",
  "MERMA_INCIDENCIA",
  "DEVOLUCION",
]);

export const TipoNotificacionEnum = z.enum([
  "cotizacion_expirada",
  "devolucion_solicitada",
  "stock_bajo",
  "pago_pendiente",
]);

export const EstadoConfeccionEnum = z.enum([
  "pendiente",
  "en_proceso",
  "completada",
  "rechazada",
  "cancelada",
]);

export const EstadoPedidoEnum = z.enum([
  "pendiente",
  "en_produccion",
  "listo_para_despacho",
  "entregado",
  "cancelado",
]);

// ============================================================================
// SCHEMAS PARA OPERACIONES RPC
// ============================================================================

/**
 * Validación para calcular costo de ficha técnica
 */
export const CalcularCostoFichaSchema = z.object({
  fichaId: z
    .number()
    .int()
    .positive("ID de ficha debe ser un número positivo"),
});

export type CalcularCostoFichaInput = z.infer<
  typeof CalcularCostoFichaSchema
>;

/**
 * Validación para crear reserva de stock
 */
export const CrearReservaStockSchema = z.object({
  productoId: z
    .string()
    .uuid("ID de producto debe ser UUID válido"),
  almacenId: z
    .string()
    .uuid("ID de almacén debe ser UUID válido"),
  cantidadAReservar: z
    .number()
    .int()
    .positive("La cantidad debe ser mayor a 0"),
  motivo: z
    .string()
    .min(5, "El motivo debe tener al menos 5 caracteres")
    .max(500, "El motivo no puede exceder 500 caracteres"),
  pedidoId: z
    .string()
    .uuid()
    .optional(),
});

export type CrearReservaStockInput = z.infer<
  typeof CrearReservaStockSchema
>;

/**
 * Validación para actualizar precio
 */
export const ActualizarPrecioSchema = z.object({
  productoId: z
    .string()
    .uuid("ID de producto debe ser UUID válido"),
  precioNuevo: z
    .number()
    .positive("El precio debe ser mayor a 0")
    .max(999999.99, "El precio no puede exceder 999,999.99"),
  razonCambio: z
    .string()
    .min(5, "La razón debe tener al menos 5 caracteres")
    .max(500, "La razón no puede exceder 500 caracteres"),
  tipoProducto: z
    .string()
    .min(1, "El tipo de producto es requerido"),
  moneda: z
    .string()
    .length(3, "La moneda debe ser código ISO de 3 letras"),
  usuarioId: z
    .string()
    .uuid("ID de usuario debe ser UUID válido"),
});

export type ActualizarPrecioInput = z.infer<
  typeof ActualizarPrecioSchema
>;

/**
 * Validación para insertar movimiento de inventario
 */
export const InsertarMovimientoSchema = z.object({
  tipoMovimiento: TipoMovimientoEnum,
  referenciaType: ReferenciaMovimientoEnum,
  referenciaId: z
    .number()
    .int()
    .positive("ID de referencia debe ser positivo"),
  cantidad: z
    .number()
    .positive("La cantidad debe ser mayor a 0"),
  motivo: z
    .string()
    .min(5, "El motivo debe tener al menos 5 caracteres")
    .max(500, "El motivo no puede exceder 500 caracteres"),
  productoId: z
    .number()
    .int()
    .positive()
    .optional(),
  insumoId: z
    .number()
    .int()
    .positive()
    .optional(),
  materialId: z
    .number()
    .int()
    .positive()
    .optional(),
  costoUnitario: z
    .number()
    .positive()
    .max(999999.99)
    .optional(),
  usuarioId: z
    .number()
    .int()
    .positive()
    .optional(),
});

export type InsertarMovimientoInput = z.infer<
  typeof InsertarMovimientoSchema
>;

/**
 * Validación para crear notificación
 */
export const CrearNotificacionSchema = z.object({
  usuarioId: z
    .number()
    .int()
    .positive("ID de usuario debe ser positivo"),
  tipo: TipoNotificacionEnum,
  titulo: z
    .string()
    .min(1, "El título es requerido")
    .max(200, "El título no puede exceder 200 caracteres"),
  mensaje: z
    .string()
    .min(1, "El mensaje es requerido")
    .max(2000, "El mensaje no puede exceder 2000 caracteres"),
  referenciaType: z
    .string()
    .optional(),
  referenciaId: z
    .number()
    .int()
    .optional(),
  urlDestino: z
    .string()
    .url("URL debe ser válida")
    .optional(),
});

export type CrearNotificacionInput = z.infer<
  typeof CrearNotificacionSchema
>;

/**
 * Validación para cambiar estado de confección
 */
export const CambiarEstadoConfeccionSchema = z.object({
  confeccionId: z
    .number()
    .int()
    .positive("ID de confección debe ser positivo"),
  estadoNuevo: EstadoConfeccionEnum,
  notasCambio: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional(),
});

export type CambiarEstadoConfeccionInput = z.infer<
  typeof CambiarEstadoConfeccionSchema
>;

/**
 * Validación para operaciones de stock
 */
export const OperacionStockSchema = z.object({
  productoId: z
    .number()
    .int()
    .positive("ID de producto debe ser positivo"),
  almacenId: z
    .number()
    .int()
    .positive("ID de almacén debe ser positivo"),
  cantidad: z
    .number()
    .positive("La cantidad debe ser mayor a 0"),
  tipoOperacion: z.enum(["entrada", "salida"]),
});

export type OperacionStockInput = z.infer<
  typeof OperacionStockSchema
>;

/**
 * Validación para filtros de auditoría
 */
export const FiltrosAuditoriaSchema = z.object({
  tabla: z
    .string()
    .optional(),
  registroId: z
    .number()
    .int()
    .optional(),
  usuarioId: z
    .number()
    .int()
    .optional(),
  fechaInicio: z
    .date()
    .optional(),
  fechaFin: z
    .date()
    .optional(),
  limit: z
    .number()
    .int()
    .positive()
    .max(500)
    .default(50),
  offset: z
    .number()
    .int()
    .nonnegative()
    .default(0),
});

export type FiltrosAuditoriaInput = z.infer<
  typeof FiltrosAuditoriaSchema
>;

// ============================================================================
// SCHEMAS PARA RESPUESTAS
// ============================================================================

export const RespuestaOperacionSchema = z.object({
  exito: z.boolean(),
  mensaje: z.string(),
  data: z.any().optional(),
  errores: z.array(z.string()).optional(),
});

export type RespuestaOperacion = z.infer<
  typeof RespuestaOperacionSchema
>;

export const RespuestaStockSchema = z.object({
  stock_actual: z.number(),
  reservas_activas: z.number(),
  disponible: z.number(),
});

export type RespuestaStock = z.infer<
  typeof RespuestaStockSchema
>;

// ============================================================================
// SCHEMAS PARA CONSULTAS Y BÚSQUEDAS
// ============================================================================

export const PaginacionSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
  offset: z
    .number()
    .int()
    .nonnegative()
    .default(0),
  orden: z.enum(["asc", "desc"]).default("desc"),
  ordenarPor: z
    .string()
    .default("created_at"),
});

export type PaginacionInput = z.infer<
  typeof PaginacionSchema
>;

/**
 * Schema para búsqueda de movimientos de inventario
 */
export const BuscarMovimientosSchema = PaginacionSchema.extend({
  productoId: z.number().int().optional(),
  insumoId: z.number().int().optional(),
  materialId: z.number().int().optional(),
  tipoMovimiento: TipoMovimientoEnum.optional(),
  referenciaType: ReferenciaMovimientoEnum.optional(),
  fechaInicio: z.date().optional(),
  fechaFin: z.date().optional(),
  almacenId: z.number().int().optional(),
});

export type BuscarMovimientosInput = z.infer<
  typeof BuscarMovimientosSchema
>;

/**
 * Schema para búsqueda de notificaciones
 */
export const BuscarNotificacionesSchema = PaginacionSchema.extend({
  usuarioId: z.number().int().positive(),
  tipo: TipoNotificacionEnum.optional(),
  leido: z.boolean().optional(),
  fechaInicio: z.date().optional(),
  fechaFin: z.date().optional(),
});

export type BuscarNotificacionesInput = z.infer<
  typeof BuscarNotificacionesSchema
>;

export default {
  // Enums
  TipoMovimientoEnum,
  ReferenciaMovimientoEnum,
  TipoNotificacionEnum,
  EstadoConfeccionEnum,
  EstadoPedidoEnum,

  // Schemas de entrada
  CalcularCostoFichaSchema,
  CrearReservaStockSchema,
  ActualizarPrecioSchema,
  InsertarMovimientoSchema,
  CrearNotificacionSchema,
  CambiarEstadoConfeccionSchema,
  OperacionStockSchema,
  FiltrosAuditoriaSchema,

  // Schemas de respuesta
  RespuestaOperacionSchema,
  RespuestaStockSchema,

  // Schemas de consulta
  PaginacionSchema,
  BuscarMovimientosSchema,
  BuscarNotificacionesSchema,
};
