import { z } from 'zod';

export const MotivoDevolucionEnum = z.enum([
  'defecto_fabrica',
  'talla_incorrecta',
  'error_envio',
  'insatisfaccion',
  'danado_transporte',
  'otros',
]);

export const EstadoDevolucionEnum = z.enum([
  'pendiente',
  'en_revision',
  'aprobada',
  'rechazada',
  'completada',
  'anulada',
]);

export const CondicionProductoEnum = z.enum([
  'perfecto_estado',
  'reproceso',
  'segunda',
  'merma',
  'sucio',
]);

export const crearDevolucionClienteSchema = z.object({
  pedido_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  pedido_item_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  motivo: MotivoDevolucionEnum,
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  notas_cliente: z.string().trim().max(1000).optional(),
  notas_internas: z.string().trim().max(1000).optional(),
  condicion_recibido: CondicionProductoEnum.optional(),
});

export const resolverDevolucionClienteSchema = z.object({
  notas_internas: z.string().trim().max(1000).optional(),
  monto_reembolsado: z.number().nonnegative().optional(),
  condicion_recibido: CondicionProductoEnum.optional(),
});

export type CrearDevolucionClienteInput = z.infer<typeof crearDevolucionClienteSchema>;
export type ResolverDevolucionClienteInput = z.infer<typeof resolverDevolucionClienteSchema>;

export interface DevolucionClienteFila {
  id: number | string;
  cliente_id: number | string;
  pedido_id: number | string | null;
  producto_id: number | string;
  variante_id: number | string;
  motivo: z.infer<typeof MotivoDevolucionEnum>;
  estado_solicitud: z.infer<typeof EstadoDevolucionEnum>;
  condicion_recibido: z.infer<typeof CondicionProductoEnum> | null;
  cantidad: number;
  monto_reembolsado: number | string | null;
  notas_cliente: string | null;
  notas_internas: string | null;
  created_at: string;
  updated_at: string;
  fecha_finalizacion: string | null;
  clientes?: {
    id?: number | string;
    razon_social?: string | null;
    nombre_comercial?: string | null;
    ruc?: string | null;
  } | null;
  pedidos?: { id?: number | string; estado?: string | null } | null;
  productos?: { id?: number | string; nombre?: string | null; sku?: string | null } | null;
  variantes_producto?: {
    id?: number | string;
    color?: string | null;
    talla?: string | null;
    sku?: string | null;
  } | null;
}
