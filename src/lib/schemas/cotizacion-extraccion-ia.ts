import { z } from 'zod';

export const cotizacionExtraccionIASchema = z.object({
  proveedor: z.object({
    ruc: z.string().nullish(),
    razon_social: z.string().nullish(),
    email: z.string().nullish(),
    telefono: z.string().nullish(),
    contacto: z.string().nullish(),
  }).default({}),

  cotizacion: z.object({
    total_estimado: z.number(),
    numero_externo: z.string().nullish(),
    fecha_solicitud: z.string().nullish(),
    fecha_vencimiento: z.string().nullish(),
    moneda: z.string().nullish(),
    notas: z.string().nullish(),
  }).default({ total_estimado: 0 }),

  items: z.array(
    z.object({
      descripcion: z.string().nullish(),
      cantidad: z.union([z.string(), z.number()]).nullish(),
      precio_unitario: z.union([z.string(), z.number()]).nullish(),
      subtotal: z.union([z.string(), z.number()]).nullish(),
      unidad: z.string().nullish(),
      tipo_item: z.enum(['insumo', 'material']).nullish(),
    })
  ).default([]),
});

export type CotizacionExtraccionIA = z.infer<typeof cotizacionExtraccionIASchema>;