import type { DespachoPortal, HitoSeguimientoDespacho } from '@/components/portal/_contexts/PortalContext';
import type { DespachoGrupo, DespachoFlat, SeguimientoDespacho } from '@/lib/services/despachos.service';

/** Normaliza la respuesta de Prisma → modelo usado en el portal cliente. */
export function mapGrupoDespachoToPortal(grupo: Record<string, unknown>): DespachoPortal {
  const pedidosGrupo = (grupo.despachos_grupo_pedidos as Array<{ pedido_id?: number | string }> | undefined) ?? [];
  const seguimientos = [...((grupo.seguimiento_despachos as HitoSeguimientoDespacho[] | undefined) ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const pedidoId = pedidosGrupo[0]?.pedido_id;

  return {
    id: Number(grupo.id),
    pedido_id: pedidoId != null ? Number(pedidoId) : 0,
    fecha_despacho: String(grupo.fecha_despacho ?? ''),
    direccion_entrega: String(grupo.direccion_entrega ?? ''),
    fecha_entrega: grupo.fecha_entrega != null ? String(grupo.fecha_entrega) : null,
    estado: String(grupo.estado ?? 'pendiente'),
    created_at: String(grupo.created_at ?? ''),
    updated_at: String(grupo.updated_at ?? ''),
    historial_grupo: seguimientos.map((h) => ({
      id: Number(h.id),
      grupo_despacho_id: Number(h.grupo_despacho_id),
      status: String(h.status),
      notas: h.notas ?? null,
      created_at: String(h.created_at),
    })),
  };
}

export async function fetchDespachosPortal(): Promise<DespachoPortal[]> {
  const res = await fetch('/api/portal/despachos', { cache: 'no-store' });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(typeof json?.error === 'string' ? json.error : `Error ${res.status}`);
  }

  if (!Array.isArray(json)) {
    return [];
  }

  return json.map((item) => mapGrupoDespachoToPortal(item as Record<string, unknown>));
}

// ─── Formateo de fechas ───────────────────────────────────────────────────────
export function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-PE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Código visual del despacho ──────────────────────────────────────────────
export function generarCodigoDespacho(id: number): string {
  return `DES-${String(id).padStart(4, '0')}`;
}

// ─── Aplanar DespachoGrupo → DespachoFlat ────────────────────────────────────
export function aplanarDespacho(grupo: DespachoGrupo): DespachoFlat {
  // Ordenar seguimientos por fecha desc y tomar el más reciente
  const seguimientos = [...(grupo.seguimiento_despachos ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return {
    id: grupo.id,
    codigo: `DES-${String(grupo.id).padStart(4, '0')}`,
    estado: grupo.estado,
    direccion_entrega: grupo.direccion_entrega,
    fecha_despacho: grupo.fecha_despacho,
    fecha_entrega: grupo.fecha_entrega,
    pedido_ids: grupo.despachos_grupo_pedidos.map(dgp => dgp.pedido_id),
    ultimo_estado: seguimientos[0] ?? null,
  };
}

// ─── Porcentaje de progreso del despacho ─────────────────────────────────────
const ORDEN_ESTADOS: Record<string, number> = {
  pendiente: 0,
  preparando: 25,
  en_ruta: 60,
  incidencia: 60,  // mismo nivel que en_ruta, bloqueado
  entregado: 100,
};

export function calcularPorcentajeRuta(estado: DespachoFlat['estado']): number {
  return ORDEN_ESTADOS[estado] ?? 0;
}

// ─── Label legible del estado ─────────────────────────────────────────────────
const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  preparando: 'Preparando',
  en_ruta: 'En ruta',
  incidencia: 'Incidencia',
  entregado: 'Entregado',
};

export function labelEstado(estado: string): string {
  return ESTADO_LABELS[estado] ?? estado;
}

// ─── Último seguimiento formateado ───────────────────────────────────────────
export function textoUltimoEstado(ultimo: SeguimientoDespacho | null): string {
  if (!ultimo) return 'Sin actualizaciones';
  const fecha = formatFechaHora(ultimo.created_at);
  return ultimo.notas ? `${fecha} — ${ultimo.notas}` : fecha;
}