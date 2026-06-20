import { INCIDENCIAS_CLIENTE_ADMIN_API, INCIDENCIAS_CLIENTE_PORTAL_API } from '@/lib/constants/incidencias-cliente';
import type {
  CrearIncidenciaClienteInput,
  IncidenciaClienteFila,
  ResponderIncidenciaClienteInput,
} from '@/lib/schemas/incidencias-cliente';

export interface ListarIncidenciasParams {
  estado?: string;
  busqueda?: string;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? 'Error en la solicitud');
  }
  return json as T;
}

export async function fetchIncidenciasClientePortal(): Promise<IncidenciaClienteFila[]> {
  const res = await fetch(INCIDENCIAS_CLIENTE_PORTAL_API, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: IncidenciaClienteFila[] }>(res);
  return json.data ?? [];
}

export async function crearIncidenciaClientePortal(
  payload: CrearIncidenciaClienteInput,
): Promise<IncidenciaClienteFila> {
  const res = await fetch(INCIDENCIAS_CLIENTE_PORTAL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: IncidenciaClienteFila }>(res);
  return json.data;
}

export async function fetchIncidenciasClienteAdmin(
  params?: ListarIncidenciasParams,
): Promise<IncidenciaClienteFila[]> {
  const search = new URLSearchParams();
  if (params?.estado && params.estado !== 'todos') search.set('estado', params.estado);
  if (params?.busqueda) search.set('busqueda', params.busqueda);

  const res = await fetch(`${INCIDENCIAS_CLIENTE_ADMIN_API}?${search}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: IncidenciaClienteFila[] }>(res);
  return json.data ?? [];
}

export async function fetchIncidenciaClienteById(
  id: string | number,
): Promise<IncidenciaClienteFila> {
  const res = await fetch(`${INCIDENCIAS_CLIENTE_ADMIN_API}/${id}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: IncidenciaClienteFila }>(res);
  return json.data;
}

export async function responderIncidenciaCliente(
  id: string | number,
  payload: ResponderIncidenciaClienteInput,
): Promise<IncidenciaClienteFila> {
  const res = await fetch(`${INCIDENCIAS_CLIENTE_ADMIN_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: IncidenciaClienteFila }>(res);
  return json.data;
}
