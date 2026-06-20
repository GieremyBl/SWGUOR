import type { FichaDetalleRow } from '@/lib/schemas/fichas-tecnicas-detalle';

const API = '/api/admin/fichas-tecnicas/detalle';

export interface FichaDetalleItemPayload {
  material_id?: string | number | null;
  insumo_id?: string | number | null;
  cantidad_consumo: number;
  porcentaje_desperdicio?: number;
  observaciones?: string | null;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function fetchFichaDetalle(ficha_id: string): Promise<FichaDetalleRow[]> {
  const res = await fetch(`${API}?ficha_id=${ficha_id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar detalle de ficha');
  const result = await res.json();
  return (result.data ?? []) as FichaDetalleRow[];
}

export async function saveFichaDetalle(
  ficha_id: string,
  items: FichaDetalleItemPayload[],
): Promise<ApiResponse<FichaDetalleRow[]>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ficha_id, items }),
  });
  return res.json();
}

export async function agregarFichaDetalleItem(
  ficha_id: string,
  item: FichaDetalleItemPayload,
): Promise<ApiResponse<FichaDetalleRow>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ficha_id, item }),
  });
  return res.json();
}

export async function actualizarFichaDetalleItem(
  id: string,
  data: Partial<FichaDetalleItemPayload>,
): Promise<ApiResponse<FichaDetalleRow>> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteFichaDetalleItem(id: string): Promise<ApiResponse> {
  const res = await fetch(`${API}?id=${id}`, { method: 'DELETE' });
  return res.json();
}
