import type { ApiResponse } from '@/lib/schemas/pedidos';

const API     = '/api/admin/pedidos';
const SEG_API = '/api/admin/seguimiento-pedido';

export async function fetchPedidos(): Promise<Record<string, unknown>[]> {
  const res = await fetch(API, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar pedidos');
  const json = await res.json();
  return json.data ?? [];
}

export async function fetchPedidoById(id: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${API}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Pedido no encontrado');
  const result = await res.json();
  return result.data ?? null;
}

export async function updatePedido(
  id: string,
  data: { estado?: string; prioridad?: string; notas_pedido?: string }
): Promise<ApiResponse> {
  const res = await fetch(`${API}/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return res.json();
}

export async function registrarSeguimientoPedido(data: {
  pedido_id: string;
  status:    string;
  notas?:    string;
}): Promise<ApiResponse> {
  const res = await fetch(SEG_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return res.json();
}

export async function fetchSeguimientosPedido(pedido_id: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${SEG_API}?pedido_id=${pedido_id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar seguimientos');
  const result = await res.json();
  return result.data ?? [];
}