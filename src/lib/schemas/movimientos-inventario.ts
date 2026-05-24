import { z } from 'zod';

// 1. Enum REAL extraído de tu captura de Supabase
export const TipoMovimientoEnum = z.enum([
  'entrada',
  'salida',
  'ajuste',
  'consumo_orden_produccion',
  'consumo_orden_produccion_item',
  'produccion_entrada',
  'devolucion_consumo',
  'devolucion_a_proveedor',
  'recepcion_devolucion_proveedor',
  'incidencia_taller',
  'devolucion_a_cliente',
  'recepcion_devolucion_cliente'
]);

// Enum de referencia adaptado para cubrir los módulos del sistema
export const ReferenciaMovimientoEnum = z.enum([
  'ORDEN_COMPRA',
  'PEDIDO_CLIENTE',
  'ORDEN_PRODUCCION',
  'AJUSTE_MANUAL',
  'MERMA_INCIDENCIA',
  'DEVOLUCION'
]);

// 2. Schema Base (Reflejo exacto de movimientos_inventario)
export const movimientoInventarioBaseSchema = z.object({
  id: z.union([z.number(), z.string(), z.bigint()]),
  producto_id: z.union([z.number(), z.string(), z.bigint()]).optional(),
  insumo_id: z.union([z.number(), z.string(), z.bigint()]).optional(),
  material_id: z.union([z.number(), z.string(), z.bigint()]).optional(),
  almacen_id: z.union([z.number(), z.string(), z.bigint()]).optional(),
  usuario_id: z.union([z.number(), z.string(), z.bigint()]).optional(),
  
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  motivo: z.string().min(3, 'El motivo debe ser descriptivo'),
  
  tipo_movimiento: TipoMovimientoEnum,
  referencia_tipo: ReferenciaMovimientoEnum,
  
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable().optional(),
})
.refine(
  (data) => {
    const cuenta = 
      (data.insumo_id ? 1 : 0) + 
      (data.material_id ? 1 : 0) + 
      (data.producto_id ? 1 : 0);
    return cuenta === 1;
  },
  {
    message: "El movimiento debe afectar exactamente a un solo recurso (Insumo, Material o Producto).",
    path: ['insumo_id']
  }
);

export const crearMovimientoSchema = movimientoInventarioBaseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type TipoMovimiento = z.infer<typeof TipoMovimientoEnum>;
export type ReferenciaMovimiento = z.infer<typeof ReferenciaMovimientoEnum>;
export type MovimientoInventario = z.infer<typeof movimientoInventarioBaseSchema>;
export type CrearMovimientoInput = z.infer<typeof crearMovimientoSchema>;