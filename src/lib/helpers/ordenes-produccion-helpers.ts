import type { ApiResponse } from '@/lib/schemas/ordenes-produccion';
import {
  fetchSeguimientosProduccion,
  registrarSeguimientoProduccion,
} from '@/lib/helpers/seguimiento-produccion-helpers';

const API = '/api/admin/ordenes-produccion';

export interface OrdenProduccionListMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  enProceso?: number;
  completadas?: number;
}

export interface OrdenProduccionPayload {
  producto_id: string | number;
  taller_id: string | number;
  ficha_id: string | number;
  pedido_id?: string | number | null;
  cantidad_solicitada: number;
  fecha_entrega?: string;
  notas?: string;
}

export interface OrdenProduccionDetalle {
  id: string;
  producto_id: string;
  taller_id: string;
  ficha_id: string;
  pedido_id: string | null;
  cantidad_solicitada: number;
  fecha_entrega: string | null;
  notas: string | null;
  etapa: string;
  estado: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  productos: {
    id: string;
    nombre: string;
    [key: string]: unknown;
  } | null;
  talleres: {
    id: string;
    nombre: string;
    [key: string]: unknown;
  } | null;
  fichas_produccion: {
    id: string;
    nombre: string;
    [key: string]: unknown;
  } | null;
  pedidos: {
    id: string;
    [key: string]: unknown;
  } | null;
}

export async function fetchOrdenesProduccion(params?: {
  producto_id?: string;
  search?: string;
  etapa?: string;
  estado?: string;
  page?: number;
  limit?: number;
}): Promise<{ ordenes: Record<string, unknown>[]; meta: OrdenProduccionListMeta }> {
  const query = new URLSearchParams();
  if (params?.producto_id) query.set('producto_id', params.producto_id);
  if (params?.search) query.set('search', params.search);
  if (params?.etapa && params.etapa !== 'all') query.set('etapa', params.etapa);
  if (params?.estado) query.set('estado', params.estado);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API}${queryString}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar órdenes');
  const result = await res.json();
  return {
    ordenes: result.ordenes ?? result.data ?? [],
    meta: result.meta ?? { total: 0, totalPages: 1, page: 1, limit: 10 },
  };
}

export async function fetchOrdenProduccionById(id: string): Promise<OrdenProduccionDetalle> {
  const res = await fetch(`${API}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Orden no encontrada');
  const result = await res.json();
  return result.data ?? result;
}

export async function createOrdenProduccion(data: OrdenProduccionPayload): Promise<ApiResponse> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateOrdenProduccion(
  id: string,
  data: Partial<OrdenProduccionPayload & { estado?: string }>,
): Promise<ApiResponse> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function registrarEtapaProduccion(data: {
  orden_id: string;
  etapa: string;
  observaciones?: string;
}): Promise<ApiResponse> {
  return registrarSeguimientoProduccion({
    orden_id: Number(data.orden_id),
    etapa: data.etapa as Parameters<typeof registrarSeguimientoProduccion>[0]['etapa'],
    observaciones: data.observaciones,
  });
}

export { fetchSeguimientosProduccion };
