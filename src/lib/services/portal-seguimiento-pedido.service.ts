import type { EstadoPedido } from '@prisma/client';

export type { EstadoPedido };

export interface SeguimientoPedido {
  id: number;
  pedido_id: number;
  status: EstadoPedido;
  notas: string | null;
  created_at: string;
  updated_at: string;
  creado_por: string | null;
}

export interface PedidoConSeguimiento {
  id: number;
  codigo: string;
  estado: EstadoPedido;
  cliente: string;
  email: string | null;
  created_at: string;
  fecha_entrega_est: string;
  fecha_entrega_est_texto: string;
  total_unidades: number;
  notas_cliente: string | null;
  direccion_despacho: string | null;
  puede_editar_direccion: boolean;
  historial: SeguimientoPedido[];
  ultimaActualizacion: string | null;
}

export async function getPedidosActivos(): Promise<PedidoConSeguimiento[]> {
  const res = await fetch('/api/portal/pedidos', {
    credentials: 'include',
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error ?? json.mensaje ?? 'Error al cargar pedidos');
  }

  return (json.data ?? []) as PedidoConSeguimiento[];
}

export async function actualizarDireccionDespacho(
  pedidoId: number,
  direccion_despacho: string,
): Promise<void> {
  const res = await fetch(`/api/pedidos/${pedidoId}/direccion`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direccion_despacho }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.mensaje ?? json.error ?? 'No se pudo actualizar la dirección');
  }
}
