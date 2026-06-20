import { DEVOLUCIONES_CLIENTE_API } from '@/lib/constants/devoluciones-cliente';
import type {
  CrearDevolucionClienteInput,
  DevolucionClienteFila,
  ResolverDevolucionClienteInput,
} from '@/lib/schemas/devoluciones-cliente';

export interface ListarDevolucionesParams {
  estado?: string;
  pedido_id?: string;
  cliente_id?: string;
  busqueda?: string;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? 'Error en la solicitud');
  }
  return json as T;
}

export async function fetchDevolucionesCliente(
  params?: ListarDevolucionesParams,
): Promise<DevolucionClienteFila[]> {
  const search = new URLSearchParams();
  if (params?.estado && params.estado !== 'todos') search.set('estado', params.estado);
  if (params?.pedido_id) search.set('pedido_id', params.pedido_id);
  if (params?.cliente_id) search.set('cliente_id', params.cliente_id);
  if (params?.busqueda) search.set('busqueda', params.busqueda);

  const res = await fetch(`${DEVOLUCIONES_CLIENTE_API}?${search}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: DevolucionClienteFila[] }>(res);
  return json.data ?? [];
}

export async function fetchDevolucionClienteById(
  id: string | number,
): Promise<DevolucionClienteFila> {
  const res = await fetch(`${DEVOLUCIONES_CLIENTE_API}/${id}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: DevolucionClienteFila }>(res);
  return json.data;
}

export async function createDevolucionCliente(
  payload: CrearDevolucionClienteInput,
): Promise<DevolucionClienteFila> {
  const res = await fetch(DEVOLUCIONES_CLIENTE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: DevolucionClienteFila }>(res);
  return json.data;
}

export async function aprobarDevolucionCliente(
  id: string | number,
  payload: ResolverDevolucionClienteInput,
): Promise<DevolucionClienteFila> {
  const res = await fetch(`${DEVOLUCIONES_CLIENTE_API}/${id}/aprobar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: DevolucionClienteFila }>(res);
  return json.data;
}

export async function rechazarDevolucionCliente(
  id: string | number,
  payload: ResolverDevolucionClienteInput,
): Promise<DevolucionClienteFila> {
  const res = await fetch(`${DEVOLUCIONES_CLIENTE_API}/${id}/rechazar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: DevolucionClienteFila }>(res);
  return json.data;
}
