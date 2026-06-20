import { CONFECCIONES_ADMIN_API } from '@/lib/constants/confecciones';
import type {
  ActualizarConfeccionInput,
  ConfeccionFila,
  ConfeccionOutput,
  CrearConfeccionInput,
} from '@/lib/schemas/confecciones';
import {
  fetchSeguimientosConfeccion,
  registrarSeguimientoConfeccion as registrarSeguimientoConfeccionApi,
} from '@/lib/helpers/seguimiento-confeccion-helpers';
import type { RegistrarSeguimientoConfeccionPayload } from '@/lib/schemas/seguimiento-confeccion';

export const CONFECCIONES_KEY = 'confecciones';

export interface ListarConfeccionesParams {
  estado?: string;
  taller_id?: string;
  orden_produccion_id?: string;
  prioridad?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ConfeccionesListResponse {
  data: ConfeccionFila[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  prioridadCounts?: {
    baja: number;
    media: number;
    alta: number;
    urgente: number;
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? 'Error en la solicitud');
  }
  return json as T;
}

export async function fetchConfecciones(
  params?: ListarConfeccionesParams,
): Promise<ConfeccionesListResponse> {
  const query = new URLSearchParams();
  if (params?.estado && params.estado !== 'todos') query.set('estado', params.estado);
  if (params?.taller_id && params.taller_id !== 'todos') query.set('taller_id', params.taller_id);
  if (params?.orden_produccion_id) query.set('orden_produccion_id', params.orden_produccion_id);
  if (params?.prioridad && params.prioridad !== 'todas') query.set('prioridad', params.prioridad);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const res = await fetch(`${CONFECCIONES_ADMIN_API}${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
  const json = await parseResponse<{
    success: boolean;
    data: ConfeccionFila[];
    meta: ConfeccionesListResponse['meta'];
    prioridadCounts?: ConfeccionesListResponse['prioridadCounts'];
  }>(res);

  return {
    data: json.data ?? [],
    meta: json.meta,
    prioridadCounts: json.prioridadCounts,
  };
}

export async function fetchConfeccionById(id: string): Promise<ConfeccionFila> {
  const res = await fetch(`${CONFECCIONES_ADMIN_API}/${id}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: ConfeccionFila }>(res);
  return json.data;
}

export async function createConfeccion(data: CrearConfeccionInput | ConfeccionOutput): Promise<ConfeccionFila> {
  const res = await fetch(CONFECCIONES_ADMIN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await parseResponse<{ success: boolean; data: ConfeccionFila }>(res);
  return json.data;
}

export async function updateConfeccion(
  id: string,
  data: ActualizarConfeccionInput,
): Promise<ConfeccionFila> {
  const res = await fetch(`${CONFECCIONES_ADMIN_API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await parseResponse<{ success: boolean; data: ConfeccionFila }>(res);
  return json.data;
}

export async function updateEstadoConfeccion(
  id: string,
  estado: string,
  notas?: string,
): Promise<ConfeccionFila> {
  const res = await fetch(`${CONFECCIONES_ADMIN_API}/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado, notas }),
  });
  const json = await parseResponse<{ success: boolean; data: ConfeccionFila }>(res);
  return json.data;
}

export async function cancelarConfeccion(id: string, notas?: string): Promise<ConfeccionFila> {
  const res = await fetch(`${CONFECCIONES_ADMIN_API}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notas }),
  });
  const json = await parseResponse<{ success: boolean; data: ConfeccionFila }>(res);
  return json.data;
}

export async function registrarSeguimientoConfeccion(data: {
  confeccion_id: string;
  estado_anterior: string;
  estado_nuevo: string;
  notas?: string;
}): Promise<unknown> {
  const payload: RegistrarSeguimientoConfeccionPayload = {
    confeccion_id: Number(data.confeccion_id),
    estado_anterior: data.estado_anterior as RegistrarSeguimientoConfeccionPayload['estado_anterior'],
    estado_nuevo: data.estado_nuevo as RegistrarSeguimientoConfeccionPayload['estado_nuevo'],
    notas: data.notas,
  };
  return registrarSeguimientoConfeccionApi(payload);
}

export { fetchSeguimientosConfeccion };
