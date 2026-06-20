import { DIRECCIONES_CLIENTE_PORTAL_API } from '@/lib/constants/direcciones-cliente';
import type {
  DireccionClienteCreateInput,
  DireccionClienteRecord,
  DireccionClienteUpdateInput,
} from '@/lib/schemas/direcciones-cliente';

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error ?? 'Error en la solicitud');
  }
  return json as T;
}

export async function fetchDireccionesClientePortal(): Promise<DireccionClienteRecord[]> {
  const res = await fetch(DIRECCIONES_CLIENTE_PORTAL_API);
  const json = await parseJsonResponse<{ success: true; data: DireccionClienteRecord[] }>(res);
  return json.data ?? [];
}

export async function crearDireccionClientePortal(
  payload: DireccionClienteCreateInput,
): Promise<DireccionClienteRecord> {
  const res = await fetch(DIRECCIONES_CLIENTE_PORTAL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseJsonResponse<{ success: true; data: DireccionClienteRecord }>(res);
  return json.data;
}

export async function actualizarDireccionClientePortal(
  id: string,
  payload: DireccionClienteUpdateInput,
): Promise<DireccionClienteRecord> {
  const res = await fetch(`${DIRECCIONES_CLIENTE_PORTAL_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseJsonResponse<{ success: true; data: DireccionClienteRecord }>(res);
  return json.data;
}

export async function eliminarDireccionClientePortal(id: string): Promise<void> {
  const res = await fetch(`${DIRECCIONES_CLIENTE_PORTAL_API}/${id}`, { method: 'DELETE' });
  await parseJsonResponse<{ success: true }>(res);
}

export function formatearUbigeo(direccion: Pick<
  DireccionClienteRecord,
  'ciudad' | 'provincia' | 'departamento' | 'pais'
>): string {
  const partes = [direccion.ciudad, direccion.provincia, direccion.departamento]
    .filter((p): p is string => Boolean(p?.trim()));

  if (partes.length === 0) {
    return direccion.pais?.trim() || 'Ubicación no especificada';
  }

  const ubigeo = partes.join(', ');
  return direccion.pais?.trim() ? `${ubigeo} · ${direccion.pais.trim()}` : ubigeo;
}

/** Texto completo para persistir en pedidos.direccion_despacho. */
export function formatearDireccionDespachoPedido(direccion: DireccionClienteRecord): string {
  const detalle = [
    direccion.direccion,
    direccion.ciudad,
    direccion.provincia,
    direccion.departamento,
    direccion.pais,
  ]
    .filter((p): p is string => Boolean(p?.trim()))
    .join(', ');

  return direccion.alias?.trim() ? `${direccion.alias} — ${detalle}` : detalle;
}

export function resolverDireccionSeleccionDefault(
  direcciones: DireccionClienteRecord[],
): string | null {
  if (direcciones.length === 0) return null;
  return direcciones.find((d) => d.es_principal)?.id ?? direcciones[0].id;
}

export function buscarDireccionPorId(
  direcciones: DireccionClienteRecord[],
  id: string | null,
): DireccionClienteRecord | null {
  if (!id) return null;
  return direcciones.find((d) => d.id === id) ?? null;
}
