import { z } from 'zod';

export const MotivoDevolucionProvEnum = z.enum([
  'insumo_defectuoso',
  'no_cumple_especificaciones',
  'exceso_pedido',
  'pedido_incompleto_danado',
  'vencimiento',
  'otros',
]);

export const EstadoDevolucionProvEnum = z.enum([
  'pendiente_envio',
  'en_transito',
  'aceptado_proveedor',
  'rechazado_proveedor',
  'completado',
]);

const proveedorIdField = z.union([z.number(), z.string()]).transform((v) => Number(v));
const cantidadField = z.number().positive('La cantidad debe ser mayor a 0');
const ordenIdField = z.union([z.number(), z.string()]).transform((v) => Number(v)).optional();

export const crearDevolucionProveedorSchema = z.discriminatedUnion('tipo_recurso', [
  z.object({
    tipo_recurso: z.literal('insumo'),
    insumo_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
    proveedor_id: proveedorIdField,
    cantidad: cantidadField,
    motivo: MotivoDevolucionProvEnum,
    orden_id: ordenIdField,
    accion_requerida: z.string().trim().max(500).optional(),
    monto_estimado_recuperar: z.number().nonnegative().optional(),
    observaciones: z.string().trim().max(2000).optional(),
  }),
  z.object({
    tipo_recurso: z.literal('material'),
    material_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
    proveedor_id: proveedorIdField,
    cantidad: cantidadField,
    motivo: MotivoDevolucionProvEnum,
    orden_id: ordenIdField,
    accion_requerida: z.string().trim().max(500).optional(),
    monto_estimado_recuperar: z.number().nonnegative().optional(),
    observaciones: z.string().trim().max(2000).optional(),
  }),
]);

export const actualizarEstadoDevolucionProveedorSchema = z.object({
  estado: EstadoDevolucionProvEnum,
  numero_guia_remision: z.string().trim().max(100).optional(),
  observaciones: z.string().trim().max(2000).optional(),
});

export type CrearDevolucionProveedorInput = z.infer<typeof crearDevolucionProveedorSchema>;
export type ActualizarEstadoDevolucionProveedorInput = z.infer<
  typeof actualizarEstadoDevolucionProveedorSchema
>;

export interface DevolucionProveedorFila {
  id: number | string;
  tipo_recurso: 'insumo' | 'material';
  proveedor_id: number | string;
  insumo_id?: number | string | null;
  material_id?: number | string | null;
  orden_id?: number | string | null;
  cantidad: number | string;
  motivo: z.infer<typeof MotivoDevolucionProvEnum> | string;
  estado: z.infer<typeof EstadoDevolucionProvEnum> | string;
  accion_requerida?: string | null;
  monto_estimado_recuperar?: number | string | null;
  fecha_salida?: string | null;
  numero_guia_remision?: string | null;
  observaciones?: string | null;
  created_at: string;
  updated_at?: string;
  proveedores?: {
    id?: number | string;
    razon_social?: string | null;
    ruc?: string | null;
  } | null;
  insumo?: {
    id?: number | string;
    nombre?: string | null;
    unidad_medida?: string | null;
    stock_actual?: number | string | null;
  } | null;
  material?: {
    id?: number | string;
    nombre?: string | null;
    unidad_medida?: string | null;
    stock_actual?: number | string | null;
  } | null;
}
