import { z } from "zod";

export const ESTADO_CONFECCION = [
  "pendiente",
  "en_proceso",
  "completada",
  "rechazada",
  "cancelada",
] as const;

export const PRIORIDAD_CONFECCION = ["baja", "media", "alta", "urgente"] as const;

export const confeccionSchema = z.object({
  // pedido_id eliminado — no existe en la tabla confecciones.
  // La relación con pedidos es indirecta: orden_produccion_id → ordenes_produccion → pedidos
  orden_produccion_id: z.number().optional(),

  taller_id: z.string().min(1, "Debe seleccionar un taller"),
  prenda: z.string().min(3, "Nombre de prenda requerido"),
  cantidad: z.number({ message: "Cantidad inválida" }).min(1, "Mínimo 1 unidad"),
  costo_unitario: z.number({ message: "Costo inválido" }).min(0.01, "Debe ser mayor a 0").optional(),
  fecha_entrega: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Fecha inválida" }),
  prioridad: z.enum(PRIORIDAD_CONFECCION),
  estado: z.enum(ESTADO_CONFECCION),
  notas: z.string().optional(),
});

export type ConfeccionFormValues = z.infer<typeof confeccionSchema>;

export const confeccionOutputSchema = confeccionSchema.transform((d) => ({
  ...d,
  taller_id: Number(d.taller_id),
  orden_produccion_id: d.orden_produccion_id ?? null,
  fecha_entrega: d.fecha_entrega ? new Date(d.fecha_entrega).toISOString() : null,
}));

export type ConfeccionOutput = z.infer<typeof confeccionOutputSchema>;

const idFlexible = z.union([z.number(), z.string()]).transform((v) => String(v));

export const crearConfeccionInputSchema = z.object({
  taller_id: idFlexible,
  prenda: z.string().trim().min(3, 'Nombre de prenda requerido'),
  cantidad: z.number({ message: 'Cantidad inválida' }).int().min(1, 'Mínimo 1 unidad'),
  costo_unitario: z.number().min(0.01).optional().nullable(),
  fecha_entrega: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: 'Fecha inválida' }),
  prioridad: z.enum(PRIORIDAD_CONFECCION).default('media'),
  estado: z.enum(ESTADO_CONFECCION).default('pendiente'),
  notas: z.string().nullable().optional(),
  orden_produccion_id: z.union([z.number(), z.string()]).nullable().optional(),
});

export const actualizarConfeccionInputSchema = z.object({
  taller_id: idFlexible.optional(),
  prenda: z.string().trim().min(3).optional(),
  cantidad: z.number().int().min(1).optional(),
  costo_unitario: z.number().min(0).nullable().optional(),
  fecha_entrega: z.string().nullable().optional(),
  prioridad: z.enum(PRIORIDAD_CONFECCION).optional(),
  estado: z.enum(ESTADO_CONFECCION).optional(),
  notas: z.string().nullable().optional(),
  orden_produccion_id: z.union([z.number(), z.string()]).nullable().optional(),
});

export const cambiarEstadoConfeccionSchema = z.object({
  estado: z.enum(ESTADO_CONFECCION),
  notas: z.string().nullable().optional(),
});

export type CrearConfeccionInput = z.infer<typeof crearConfeccionInputSchema>;
export type ActualizarConfeccionInput = z.infer<typeof actualizarConfeccionInputSchema>;

export interface ConfeccionFila {
  id: number | string;
  taller_id: number | string;
  prenda: string;
  cantidad: number;
  costo_unitario: number | string | null;
  fecha_entrega: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  prioridad: typeof PRIORIDAD_CONFECCION[number];
  estado: typeof ESTADO_CONFECCION[number];
  notas: string | null;
  observaciones: string | null;
  orden_produccion_id: number | string | null;
  created_at: string;
  updated_at: string;
  talleres?: { id?: number | string; nombre?: string | null } | null;
  ordenes_produccion?: {
    id?: number | string;
    estado?: string | null;
    pedidos?: { id?: number | string; estado?: string | null } | null;
  } | null;
}

export const ESTADO_LABELS: Record<typeof ESTADO_CONFECCION[number], string> = {
  pendiente: "Pendiente",
  en_proceso: "En Proceso",
  completada: "Completada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

export const PRIORIDAD_LABELS: Record<typeof PRIORIDAD_CONFECCION[number], string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};