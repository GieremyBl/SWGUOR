import { z } from 'zod';

export const EstadoOrdenCompraEnum = z.enum([
  'pendiente',
  'confirmada',
  'parcialmente_recibida',
  'completada',
  'cancelada',
]);

export const EstadoPagoOrdenCompraEnum = z.enum(['pendiente', 'parcial', 'pagado']);

export const ordenCompraItemSchema = z
  .object({
    material_id: z.coerce.number().int().positive().optional().nullable(),
    insumo_id: z.coerce.number().int().positive().optional().nullable(),
    cantidad_pedida: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
    precio_unitario: z.coerce.number().nonnegative('El precio no puede ser negativo'),
    notas: z.string().max(500).optional().nullable(),
  })
  .refine(
    (item) => {
      const hasMaterial = item.material_id != null;
      const hasInsumo = item.insumo_id != null;
      return hasMaterial !== hasInsumo;
    },
    { message: 'Cada ítem debe tener material o insumo (no ambos ni ninguno)' },
  );

export const ordenCompraBaseSchema = z.object({
  id: z.coerce.number().int().positive(),
  cotizacion_proveedor_id: z.coerce.number().int().positive().nullable().optional(),
  proveedor_id: z.coerce.number().int().positive(),
  creado_por: z.string().uuid().nullable().optional(),
  estado: EstadoOrdenCompraEnum.default('pendiente'),
  estado_pago: EstadoPagoOrdenCompraEnum.default('pendiente'),
  total_orden: z.coerce.number().nonnegative().default(0),
  total_pagado: z.coerce.number().nonnegative().default(0),
  saldo_pendiente: z.coerce.number().nullable().optional(),
  fecha_prometida: z.coerce.date().nullable().optional(),
  fecha_recepcion: z.coerce.date().nullable().optional(),
  notas: z.string().max(2000).nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
});

export const crearOrdenCompraSchema = z.object({
  proveedor_id: z.coerce.number().int().positive(),
  cotizacion_proveedor_id: z.coerce.number().int().positive().optional().nullable(),
  fecha_prometida: z.coerce.date().optional().nullable(),
  notas: z.string().max(2000).optional().nullable(),
  items: z.array(ordenCompraItemSchema).min(1, 'Debe incluir al menos un ítem'),
});

export const crearOrdenDesdeCotizacionSchema = z.object({
  cotizacion_proveedor_id: z.coerce.number().int().positive(),
  fecha_prometida: z.coerce.date().optional().nullable(),
  notas: z.string().max(2000).optional().nullable(),
});

export const actualizarOrdenCompraSchema = z.object({
  estado: EstadoOrdenCompraEnum.optional(),
  estado_pago: EstadoPagoOrdenCompraEnum.optional(),
  fecha_prometida: z.coerce.date().optional().nullable(),
  fecha_recepcion: z.coerce.date().optional().nullable(),
  notas: z.string().max(2000).optional().nullable(),
  total_pagado: z.coerce.number().nonnegative().optional(),
});

export const listarOrdenesCompraSchema = z.object({
  proveedor_id: z.coerce.number().int().positive().optional(),
  estado: EstadoOrdenCompraEnum.optional(),
  estado_pago: EstadoPagoOrdenCompraEnum.optional(),
  cotizacion_proveedor_id: z.coerce.number().int().positive().optional(),
});

export type EstadoOrdenCompra = z.infer<typeof EstadoOrdenCompraEnum>;
export type EstadoPagoOrdenCompra = z.infer<typeof EstadoPagoOrdenCompraEnum>;
export type OrdenCompraItemInput = z.infer<typeof ordenCompraItemSchema>;
export type OrdenCompra = z.infer<typeof ordenCompraBaseSchema>;
export type CrearOrdenCompra = z.infer<typeof crearOrdenCompraSchema>;
export type CrearOrdenDesdeCotizacion = z.infer<typeof crearOrdenDesdeCotizacionSchema>;
export type ActualizarOrdenCompra = z.infer<typeof actualizarOrdenCompraSchema>;
