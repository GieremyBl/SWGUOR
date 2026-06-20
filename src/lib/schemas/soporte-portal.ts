import { z } from 'zod';
import { MotivoDevolucionEnum } from '@/lib/schemas/devoluciones-cliente';

export const crearDevolucionClientePortalSchema = z.object({
  pedido_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  pedido_item_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  motivo: MotivoDevolucionEnum,
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  notas_cliente: z.string().trim().max(1000).optional(),
  fotos_url: z.array(z.string().url()).max(5).optional().default([]),
});

export type CrearDevolucionClientePortalInput = z.infer<typeof crearDevolucionClientePortalSchema>;

export interface PedidoEntregadoPortalItem {
  id: string;
  pedido_id: string;
  producto_id: string;
  variante_id: string;
  cantidad: number;
  productos?: { id: string; nombre: string | null; sku: string | null } | null;
  variantes_producto?: {
    id: string;
    color: string | null;
    talla: string | null;
    sku: string | null;
  } | null;
}

export interface PedidoEntregadoPortal {
  id: string;
  estado: string | null;
  created_at: string | null;
  total: string | number | null;
  pedido_items: PedidoEntregadoPortalItem[];
}
