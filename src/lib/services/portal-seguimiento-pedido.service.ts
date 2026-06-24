import type { EstadoPedido } from '@prisma/client';

export type { EstadoPedido };

export interface SeguimientoPedido {
  id:        number | string;
  pedido_id: number | string;
  status:    EstadoPedido;
  notas:     string | null;
  creado_por: string | null;
  created_at: string;
}

export interface PedidoConSeguimiento {
  // ── Campos de DB ──────────────────────────────────────────────
  id:               number;
  estado:           EstadoPedido;
  created_at:       string;
  total_unidades:   number;
  notas_cliente:    string | null;
  direccion_despacho: string | null;

  // ── Campos de joins ───────────────────────────────────────────
  cliente:          string;
  email:            string | null;

  // ── Campos derivados/computados por la API ────────────────────
  codigo:           string;
  /** Estimado calculado desde created_at + SLA de producción */
  fecha_entrega_est:       string;
  fecha_entrega_est_texto: string;
  /** true solo cuando estado === 'pendiente' */
  puede_editar_direccion:  boolean;

  // ── Relaciones ────────────────────────────────────────────────
  historial:           SeguimientoPedido[];
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
  const res = await fetch(`/api/portal/pedidos/${pedidoId}/direccion`, {
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
