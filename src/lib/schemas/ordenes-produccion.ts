import { z } from "zod";

export const ESTADO_ORDEN_PRODUCCION = [
  "borrador",
  "confirmada",
  "en_produccion",
  "pausada",
  "completada",
  "cancelada",
] as const;

export const ETAPAS_PRODUCCION = [
  "diseno",
  "patronaje",
  "corte",
  "confeccion",
  "remallado",
  "bordado_estampado",
  "control_calidad",
  "acabado",
  "listo_entrega",
] as const;

export const ordenProduccionSchema = z.object({
  producto_id: z.number().min(1, "Producto requerido"),
  taller_id: z.number().min(1, "Taller requerido"),
  ficha_id: z.number().min(1, "Ficha técnica requerida"),
  pedido_id: z.number().min(1, "Pedido requerido"),
  cantidad_solicitada: z.number().min(1, "Mínimo 1 unidad"),
  fecha_entrega: z.string().optional(),
  notas: z.string().optional(),
});

export type OrdenProduccionFormValues = z.infer<typeof ordenProduccionSchema>;

export const ESTADO_ORDEN_LABELS: Record<typeof ESTADO_ORDEN_PRODUCCION[number], string> = {
  borrador: "Borrador",
  confirmada: "Confirmada",
  en_produccion: "En Producción",
  pausada: "Pausada",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const ETAPA_LABELS: Record<typeof ETAPAS_PRODUCCION[number], string> = {
  diseno: "Diseño",
  patronaje: "Patronaje",
  corte: "Corte",
  confeccion: "Confección",
  remallado: "Remallado",
  bordado_estampado: "Bordado / Estampado",
  control_calidad: "Control de Calidad",
  acabado: "Acabado",
  listo_entrega: "Listo para Entrega",
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}