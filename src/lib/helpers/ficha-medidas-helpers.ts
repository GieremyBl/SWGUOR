import type { FichaMedidaRow } from '@/lib/schemas/ficha-medidas';

const API = '/api/admin/ficha-medidas';

export interface FichaMedidaPayload {
  punto_medida: string;
  talla: string;
  valor_cm?: number | null;
  tolerancia?: number | null;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function fetchFichaMedidas(ficha_id: string): Promise<FichaMedidaRow[]> {
  const res = await fetch(`${API}?ficha_id=${ficha_id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar medidas');
  const result = await res.json();
  return (result.data ?? []) as FichaMedidaRow[];
}

export async function saveFichaMedidasBulk(
  ficha_id: string,
  medidas: FichaMedidaPayload[],
): Promise<ApiResponse<FichaMedidaRow[]>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ficha_id, medidas }),
  });
  return res.json();
}

export async function agregarFichaMedida(
  ficha_id: string,
  medida: FichaMedidaPayload,
): Promise<ApiResponse<FichaMedidaRow>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ficha_id, medida }),
  });
  return res.json();
}

export async function actualizarFichaMedida(
  id: string,
  data: Partial<FichaMedidaPayload>,
): Promise<ApiResponse<FichaMedidaRow>> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteFichaMedida(id: string): Promise<ApiResponse> {
  const res = await fetch(`${API}?id=${id}`, { method: 'DELETE' });
  return res.json();
}
