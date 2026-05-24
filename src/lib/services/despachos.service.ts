import { getSupabaseBrowserClient } from "@/lib/supabase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EstadoDespacho =
  | 'pendiente'
  | 'preparando'
  | 'en_ruta'
  | 'entregado'
  | 'incidencia';

export type TipoIncidenciaCliente =
  | 'defecto_confeccion'
  | 'pedido_equivocado'
  | 'talla_incorrecta'
  | 'cantidad_incorrecta'
  | 'dano_en_transporte'
  | 'empaque_defectuoso'
  | 'otro';

export type SeveridadIncidencia = 'baja' | 'media' | 'alta' | 'critica';

export interface SeguimientoDespacho {
  id: number;
  grupo_despacho_id: number;
  status: EstadoDespacho;
  notas: string | null;
  creado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface DespachoGrupoPedido {
  id: number;
  grupo_despacho_id: number;
  despacho_id: number;
  pedido_id: number;
  created_at: string;
}

export interface DespachoGrupo {
  id: number;
  direccion_entrega: string;
  direccion_entrega_original: string | null;
  estado: EstadoDespacho;
  fecha_despacho: string;
  fecha_entrega: string | null;
  created_at: string;
  updated_at: string;
  despachos_grupo_pedidos: DespachoGrupoPedido[];
  seguimiento_despachos: SeguimientoDespacho[];
}

export interface DespachoFlat {
  id: number;
  codigo: string;
  estado: EstadoDespacho;
  direccion_entrega: string;
  fecha_despacho: string;
  fecha_entrega: string | null;
  pedido_ids: number[];
  ultimo_estado: SeguimientoDespacho | null;
}

export interface CreateIncidenciaPayload {
  pedido_id: number;
  tipo: TipoIncidenciaCliente;
  severidad: SeveridadIncidencia;
  descripcion: string;
  evidencia_url: string[];
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getDespachoActivos(): Promise<DespachoGrupo[]> {
  const res = await fetch('/api/portal/despachos', {
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json() as { error?: string };
    throw new Error(body.error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<DespachoGrupo[]>;
}

export async function getDespachoById(id: number): Promise<DespachoGrupo | null> {
  const res = await fetch(`/api/portal/despachos/${id}`, {
    credentials: 'include',
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.json() as { error?: string };
    throw new Error(body.error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<DespachoGrupo>;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export function subscribeToGrupo(
  grupoId: number,
  onUpdate: (seguimiento: SeguimientoDespacho) => void,
): () => void {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel(`seguimiento-despacho-${grupoId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'seguimiento_despachos',
        filter: `grupo_despacho_id=eq.${grupoId}`,
      },
      (payload) => onUpdate(payload.new as SeguimientoDespacho),
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ─── Incidencias ──────────────────────────────────────────────────────────────

export async function uploadEvidencia(pedidoId: number, file: File): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `incidencias/${pedidoId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('evidencias')
    .upload(path, file, { upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('evidencias').getPublicUrl(path);
  return data.publicUrl;
}

export async function createIncidenciaCliente(
  payload: CreateIncidenciaPayload,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.from('incidencias_cliente').insert({
    pedido_id: payload.pedido_id,
    tipo: payload.tipo,
    descripcion: payload.descripcion,
    evidencia_url: payload.evidencia_url,
    estado: 'abierta',
  });

  if (error) throw new Error(error.message);
}