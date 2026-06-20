import { z } from 'zod';

export const MetodoPagoEnum = z.enum([
  'efectivo',
  'transferencia_bcp',
  'yape',
  'plin',
  'visa',
  'mastercard',
]);

export const EstadoPagoTallerEnum = z.enum(['pendiente', 'pagado', 'anulado']);

export const pagoTallerBaseSchema = z.object({
  id: z.number().int().positive(),
  taller_id: z.number().int().positive(),
  confeccion_id: z.number().int().positive().nullable().optional(),
  orden_produccion_id: z.number().int().positive().nullable().optional(),
  monto: z.number().positive(),
  moneda: z.string().max(3).default('PEN'),
  metodo_pago: MetodoPagoEnum,
  estado: EstadoPagoTallerEnum.default('pendiente'),
  fecha_pago: z.date(),
  numero_operacion: z.string().nullable().optional(),
  comprobante_url: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  registrado_por: z.number().int().positive().nullable().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const crearPagoTallerSchema = pagoTallerBaseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  estado: true,
});

export const registrarPagoSchema = z.object({
  pagoTallerId: z.number().int().positive(),
  numero_operacion: z.string().optional(),
  comprobante_url: z.string().optional(),
  notas: z.string().optional(),
});

export const obtenerPagosTallerSchema = z.object({
  filtro: z
    .object({
      taller_id: z.number().int().positive().optional(),
      confeccion_id: z.number().int().positive().optional(),
      orden_produccion_id: z.number().int().positive().optional(),
      estado: EstadoPagoTallerEnum.optional(),
      metodo_pago: MetodoPagoEnum.optional(),
      desde: z.date().optional(),
      hasta: z.date().optional(),
    })
    .optional(),
  paginacion: z
    .object({
      pagina: z.number().int().positive().default(1),
      limite: z.number().int().positive().default(20),
    })
    .optional(),
});

export type MetodoPago = z.infer<typeof MetodoPagoEnum>;
export type EstadoPagoTaller = z.infer<typeof EstadoPagoTallerEnum>;
export type PagoTaller = z.infer<typeof pagoTallerBaseSchema>;
export type CrearPagoTaller = z.infer<typeof crearPagoTallerSchema>;

const fechaFlexible = z.union([
  z.string().min(1),
  z.date(),
]).transform((v) => (v instanceof Date ? v : new Date(v)));

export const crearPagoTallerInputSchema = z.object({
  taller_id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  confeccion_id: z.union([z.number(), z.string()]).transform((v) => String(v)).optional(),
  orden_produccion_id: z.union([z.number(), z.string()]).transform((v) => String(v)).optional(),
  monto: z.number().positive('El monto debe ser mayor a cero'),
  moneda: z.string().max(3).default('PEN'),
  metodo_pago: MetodoPagoEnum,
  fecha_pago: fechaFlexible,
  numero_operacion: z.string().nullable().optional(),
  comprobante_url: z.string().url().nullable().optional().or(z.literal('')),
  notas: z.string().nullable().optional(),
});

export const actualizarPagoTallerInputSchema = z.object({
  monto: z.number().positive().optional(),
  metodo_pago: MetodoPagoEnum.optional(),
  fecha_pago: fechaFlexible.optional(),
  numero_operacion: z.string().nullable().optional(),
  comprobante_url: z.string().url().nullable().optional().or(z.literal('')),
  notas: z.string().nullable().optional(),
  moneda: z.string().max(3).optional(),
});

export const registrarPagoTallerInputSchema = z.object({
  monto: z.number().positive().optional(),
  metodo_pago: MetodoPagoEnum.optional(),
  fecha_pago: fechaFlexible.optional(),
  numero_operacion: z.string().optional(),
  comprobante_url: z.string().url().optional().or(z.literal('')),
  notas: z.string().optional(),
});

export const anularPagoTallerInputSchema = z.object({
  notas: z.string().optional(),
});

export type CrearPagoTallerInput = z.infer<typeof crearPagoTallerInputSchema>;
export type ActualizarPagoTallerInput = z.infer<typeof actualizarPagoTallerInputSchema>;
export type RegistrarPagoTallerInput = z.infer<typeof registrarPagoTallerInputSchema>;
export type AnularPagoTallerInput = z.infer<typeof anularPagoTallerInputSchema>;

export interface PagoTallerFila {
  id: number | string;
  taller_id: number | string;
  confeccion_id: number | string | null;
  orden_produccion_id: number | string | null;
  monto: number | string;
  moneda: string;
  metodo_pago: z.infer<typeof MetodoPagoEnum>;
  estado: z.infer<typeof EstadoPagoTallerEnum>;
  fecha_pago: string;
  numero_operacion: string | null;
  comprobante_url: string | null;
  notas: string | null;
  registrado_por: number | string | null;
  created_at: string;
  updated_at: string;
  talleres?: { id?: number | string; nombre?: string | null; ruc?: string | null } | null;
  confecciones?: { id?: number | string; prenda?: string | null } | null;
  ordenes_produccion?: { id?: number | string; estado?: string | null } | null;
  usuarios?: { id?: number | string; email?: string | null } | null;
}

export interface PagosTallerListResponse {
  data: PagoTallerFila[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}