import { z } from "zod";

export const ESTADO_PEDIDO = [
  "pendiente",
  "en_produccion",
  "listo_para_despacho",
  "entregado",
  "cancelado",
] as const;

export const PRIORIDAD_PEDIDO = ["baja", "normal", "alta", "urgente"] as const;

export const pedidoSchema = z.object({
  cliente_id:    z.number().min(1, "Cliente requerido"),
  estado:        z.enum(ESTADO_PEDIDO).default("pendiente"),
  prioridad:     z.enum(PRIORIDAD_PEDIDO).default("normal"),
  notas_cliente: z.string().optional(),
  notas_pedido:  z.string().optional(),
  total_estimado: z.number().min(0).optional(),
  total_unidades: z.number().min(0).default(0),
  moq_aplicado:   z.number().min(0).default(400),
});

export type PedidoFormValues = z.infer<typeof pedidoSchema>;

export const ESTADO_PEDIDO_LABELS: Record<typeof ESTADO_PEDIDO[number], string> = {
  pendiente:           "Pendiente",
  en_produccion:       "En Producción",
  listo_para_despacho: "Listo para Despacho",
  entregado:           "Entregado",
  cancelado:           "Cancelado",
};

export const PRIORIDAD_PEDIDO_LABELS: Record<typeof PRIORIDAD_PEDIDO[number], string> = {
  baja:    "Baja",
  normal:  "Normal",
  alta:    "Alta",
  urgente: "Urgente",
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?:   T;
  error?:  string;
  message?: string;
}