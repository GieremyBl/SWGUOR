import {
  SOPORTE_DEVOLUCIONES_API,
  SOPORTE_INCIDENCIAS_API,
  SOPORTE_PEDIDOS_ENTREGADOS_API,
} from '@/lib/constants/soporte-portal';
import type { DevolucionClienteFila } from '@/lib/schemas/devoluciones-cliente';
import type {
  CrearIncidenciaClienteInput,
  IncidenciaClienteFila,
} from '@/lib/schemas/incidencias-cliente';
import type {
  CrearDevolucionClientePortalInput,
  PedidoEntregadoPortal,
} from '@/lib/schemas/soporte-portal';
import { getSupabaseBrowserClient } from '@/lib/supabase';

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error ?? 'Error en la solicitud');
  }
  return json as T;
}

export async function fetchIncidenciasSoportePortal(): Promise<IncidenciaClienteFila[]> {
  const res = await fetch(SOPORTE_INCIDENCIAS_API, { cache: 'no-store' });
  const json = await parseResponse<{ success: true; data: IncidenciaClienteFila[] }>(res);
  return json.data ?? [];
}

export async function crearIncidenciaSoportePortal(
  payload: CrearIncidenciaClienteInput,
): Promise<IncidenciaClienteFila> {
  const res = await fetch(SOPORTE_INCIDENCIAS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: true; data: IncidenciaClienteFila }>(res);
  return json.data;
}

export async function fetchDevolucionesSoportePortal(): Promise<DevolucionClienteFila[]> {
  const res = await fetch(SOPORTE_DEVOLUCIONES_API, { cache: 'no-store' });
  const json = await parseResponse<{ success: true; data: DevolucionClienteFila[] }>(res);
  return json.data ?? [];
}

export async function crearDevolucionSoportePortal(
  payload: CrearDevolucionClientePortalInput,
): Promise<DevolucionClienteFila> {
  const res = await fetch(SOPORTE_DEVOLUCIONES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: true; data: DevolucionClienteFila }>(res);
  return json.data;
}

export async function fetchPedidosEntregadosSoportePortal(): Promise<PedidoEntregadoPortal[]> {
  const res = await fetch(SOPORTE_PEDIDOS_ENTREGADOS_API, { cache: 'no-store' });
  const json = await parseResponse<{ success: true; data: PedidoEntregadoPortal[] }>(res);
  return json.data ?? [];
}

export async function uploadEvidenciaSoporte(
  pedidoId: number,
  file: File,
  carpeta: 'incidencias' | 'devoluciones',
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${carpeta}/${pedidoId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('evidencias')
    .upload(path, file, { upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('evidencias').getPublicUrl(path);
  return data.publicUrl;
}
