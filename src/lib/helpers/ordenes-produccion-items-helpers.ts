import type {
  OrdenProduccionItemPayload,
  OrdenProduccionItemRow,
} from '@/lib/schemas/ordenes-produccion-items';

const API = '/api/admin/ordenes-produccion/items';

interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function fetchOrdenProduccionItems(
  orden_produccion_id: string,
): Promise<OrdenProduccionItemRow[]> {
  const res = await fetch(`${API}?orden_produccion_id=${orden_produccion_id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Error al cargar ítems de la orden');
  const result = await res.json();
  return (result.data ?? []) as OrdenProduccionItemRow[];
}

export async function agregarOrdenProduccionItem(
  orden_produccion_id: string,
  item: OrdenProduccionItemPayload,
): Promise<ApiResponse<OrdenProduccionItemRow>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orden_produccion_id, ...item }),
  });
  return res.json();
}

export async function actualizarOrdenProduccionItem(
  id: string,
  data: Partial<OrdenProduccionItemPayload>,
): Promise<ApiResponse<OrdenProduccionItemRow>> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function eliminarOrdenProduccionItem(id: string): Promise<ApiResponse> {
  const res = await fetch(`${API}?id=${id}`, { method: 'DELETE' });
  return res.json();
}

export interface PedidoItemOption {
  id: string;
  cantidad: number;
  talla?: string | null;
  color?: string | null;
  producto_id: string;
  variante_id?: string | null;
  producto_nombre: string;
  variante_label?: string;
}

export async function fetchPedidoItemsParaOrden(
  pedido_id: string,
): Promise<PedidoItemOption[]> {
  const res = await fetch(`/api/admin/pedidos/${pedido_id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar ítems del pedido');
  const result = await res.json();
  const items = result.data?.pedido_items ?? [];

  return items.map((it: Record<string, unknown>) => {
    const producto = it.productos as { id?: string | number; nombre?: string } | undefined;
    const variante = it.variantes_producto as { id?: string | number; talla?: string; color?: string } | null;
    const varianteLabel = variante
      ? [variante.talla, variante.color].filter(Boolean).join(' / ')
      : undefined;

    return {
      id: String(it.id),
      cantidad: Number(it.cantidad),
      talla: variante?.talla ?? null,
      color: variante?.color ?? null,
      producto_id: String(it.producto_id ?? producto?.id ?? ''),
      variante_id: it.variante_id ? String(it.variante_id) : variante?.id ? String(variante.id) : null,
      producto_nombre: producto?.nombre ?? 'Producto',
      variante_label: varianteLabel,
    };
  });
}
