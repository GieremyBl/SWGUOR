import type { ApiResponse, Taller, TallerForm } from '@/lib/schemas/talleres';

const API = '/api/admin/talleres';

export async function fetchTalleres(params?: {
  search?: string;
  estado?: string;
}): Promise<Taller[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.estado && params.estado !== 'todos') query.set('estado', params.estado);

  const qs = query.toString();
  const res = await fetch(`${API}${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar talleres');
  const result = await res.json();
  return (result.data ?? []) as Taller[];
}

export async function fetchTallerById(id: string): Promise<Taller> {
  const res = await fetch(`${API}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Taller no encontrado');
  const result = await res.json();
  return result.data as Taller;
}

export async function createTaller(data: TallerForm): Promise<ApiResponse<Taller>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTaller(
  id: string,
  data: Partial<TallerForm>,
): Promise<ApiResponse<Taller>> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deactivateTaller(id: string): Promise<ApiResponse> {
  const res = await fetch(`${API}?id=${id}`, { method: 'DELETE' });
  return res.json();
}

export async function suspendTaller(id: string): Promise<ApiResponse<Taller>> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'suspendido' }),
  });
  return res.json();
}
