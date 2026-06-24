import type { EstadoPedido } from '@prisma/client';

export interface SeguimientoPedidoRow {
  id:         number | string;
  pedido_id:  number | string;
  status:     EstadoPedido;
  notas:      string | null;
  /** UUID → cancelación manual (admin/gerente). null → trigger de BD. */
  creado_por: string | null;
  created_at: string;
}

export async function getSeguimientoPorPedido(
  pedidoId: number | string,
): Promise<SeguimientoPedidoRow[]> {
  const res = await fetch(
    `/api/admin/pedidos/seguimiento?pedido_id=${pedidoId}`,
    { credentials: 'include', cache: 'no-store' },
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Error al cargar historial de seguimiento');

  return (json.data ?? []) as SeguimientoPedidoRow[];
}