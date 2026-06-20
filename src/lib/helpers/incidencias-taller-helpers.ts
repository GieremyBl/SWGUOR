import { INCIDENCIAS_TALLER_ADMIN_API } from '@/lib/constants/incidencias-taller';
import type {
  AsignarIncidenciaTallerInput,
  CrearIncidenciaTallerInput,
  EditarIncidenciaTallerInput,
  IncidenciaTallerFila,
  IncidenciasTallerListResponse,
  ResolverIncidenciaTallerInput,
} from '@/lib/schemas/incidencias-taller';

export const INCIDENCIAS_TALLER_KEY = 'incidencias-taller';

export interface ListarIncidenciasTallerParams {
  severidad?: string;
  resuelto?: string;
  confeccion_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? 'Error en la solicitud');
  }
  return json as T;
}

export async function fetchIncidenciasTaller(
  params?: ListarIncidenciasTallerParams,
): Promise<IncidenciasTallerListResponse> {
  const search = new URLSearchParams();
  if (params?.severidad && params.severidad !== 'todas') {
    search.set('severidad', params.severidad);
  }
  if (params?.resuelto && params.resuelto !== 'todos') {
    search.set('resuelto', params.resuelto);
  }
  if (params?.confeccion_id) search.set('confeccion_id', params.confeccion_id);
  if (params?.search) search.set('search', params.search);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));

  const qs = search.toString();
  const res = await fetch(`${INCIDENCIAS_TALLER_ADMIN_API}${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
  const json = await parseResponse<{ success: boolean; data: IncidenciaTallerFila[]; meta: IncidenciasTallerListResponse['meta'] }>(res);
  return { data: json.data ?? [], meta: json.meta };
}

export async function fetchIncidenciaTallerById(
  id: string | number,
): Promise<IncidenciaTallerFila> {
  const res = await fetch(`${INCIDENCIAS_TALLER_ADMIN_API}/${id}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: IncidenciaTallerFila }>(res);
  return json.data;
}

export async function crearIncidenciaTaller(
  payload: CrearIncidenciaTallerInput,
): Promise<IncidenciaTallerFila> {
  const res = await fetch(INCIDENCIAS_TALLER_ADMIN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: IncidenciaTallerFila }>(res);
  return json.data;
}

export async function resolverIncidenciaTaller(
  id: string | number,
  payload: ResolverIncidenciaTallerInput,
): Promise<IncidenciaTallerFila> {
  const res = await fetch(`${INCIDENCIAS_TALLER_ADMIN_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: IncidenciaTallerFila }>(res);
  return json.data;
}

export async function asignarIncidenciaTaller(
  id: string | number,
  payload: AsignarIncidenciaTallerInput,
): Promise<IncidenciaTallerFila> {
  const res = await fetch(`${INCIDENCIAS_TALLER_ADMIN_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: IncidenciaTallerFila }>(res);
  return json.data;
}

export async function editarIncidenciaTaller(
  id: string | number,
  payload: EditarIncidenciaTallerInput,
): Promise<IncidenciaTallerFila> {
  const res = await fetch(`${INCIDENCIAS_TALLER_ADMIN_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: IncidenciaTallerFila }>(res);
  return json.data;
}
