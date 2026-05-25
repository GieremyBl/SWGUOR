import { z } from 'zod';
import { ESTADO_COTIZACION_PROVEEDOR } from '@/lib/constants/cotizacion-proveedor-estados';

const estadosValidos = [
  ESTADO_COTIZACION_PROVEEDOR.BORRADOR,
  ESTADO_COTIZACION_PROVEEDOR.CERRADO,
  ESTADO_COTIZACION_PROVEEDOR.CONVERTIDA,
  ESTADO_COTIZACION_PROVEEDOR.ANULADO,
] as const;

export const cotizacionProveedorItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  descripcion: z.string().min(1, 'Descripción requerida'),
  cantidad: z.coerce.number().positive('Cantidad debe ser mayor a 0'),
  precio_unitario: z.coerce.number().nonnegative('Precio no puede ser negativo'),
  unidad: z.string().max(30).optional().default('unidades'),
  tipo_item: z.enum(['insumo', 'material']).optional().default('insumo'),
  material_id: z.union([z.string(), z.number()]).nullable().optional(),
  insumo_id: z.union([z.string(), z.number()]).nullable().optional(),
  notas: z.string().nullable().optional(),
});

export const crearCotizacionProveedorSchema = z.object({
  proveedor_id: z.coerce.number().int().positive('Seleccione un proveedor'),
  numero_externo: z.string().max(80).nullable().optional(),
  fecha_solicitud: z.string().min(1, 'Fecha de cotización requerida'),
  fecha_vencimiento: z.string().nullable().optional(),
  moneda: z.enum(['PEN', 'USD', 'EUR']).default('PEN'),
  notas: z.string().nullable().optional(),
  items: z.array(cotizacionProveedorItemSchema).min(1, 'Debe haber al menos un ítem'),
});

export const actualizarCotizacionProveedorSchema = crearCotizacionProveedorSchema;

export const cambiarEstadoCotizacionProveedorSchema = z.object({
  estado: z.enum(estadosValidos),
});

export type CrearCotizacionProveedorInput = z.infer<typeof crearCotizacionProveedorSchema>;
export type ActualizarCotizacionProveedorInput = z.infer<typeof actualizarCotizacionProveedorSchema>;
export type CotizacionProveedorItemInput = z.infer<typeof cotizacionProveedorItemSchema>;
