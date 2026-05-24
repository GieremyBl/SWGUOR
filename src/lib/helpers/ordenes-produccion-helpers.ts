import type { ApiResponse } from '@/lib/schemas/ordenes-produccion';

const API     = '/api/admin/ordenes-produccion';
const SEG_API = '/api/admin/seguimiento-produccion';

export async function fetchOrdenesProduccion(params?: {
  producto_id?: string;
  search?: string;
  etapa?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[], meta?: any }> {
  const query = new URLSearchParams();
  if (params?.producto_id) query.set('producto_id', params.producto_id);
  if (params?.search) query.set('search', params.search);
  if (params?.etapa && params.etapa !== 'all') query.set('etapa', params.etapa);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res    = await fetch(`${API}${queryString}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar órdenes');
  const result = await res.json();
  return { data: result.data ?? [], meta: result.meta };
}

export async function createOrdenProduccion(data: {
  producto_id:         string | number;
  taller_id:           string | number;
  ficha_id:            string | number;
  cantidad_solicitada: number;
  fecha_entrega?:      string;
  notas?:              string;
}): Promise<ApiResponse> {
  const res = await fetch(API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return res.json();
}

export async function updateOrdenProduccion(
  id: string,
  data: { estado?: string; fecha_entrega?: string; notas?: string }
): Promise<ApiResponse> {
  const res = await fetch(API, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id, ...data }),
  });
  return res.json();
}

export async function registrarEtapaProduccion(data: {
  orden_id:     string;
  etapa:        string;
  observaciones?: string;
}): Promise<ApiResponse> {
  const res = await fetch(SEG_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return res.json();
}

export async function fetchSeguimientosProduccion(orden_id: string): Promise<any[]> {
  const res = await fetch(`${SEG_API}?orden_id=${orden_id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar seguimientos');
  const result = await res.json();
  return result.data ?? [];
}