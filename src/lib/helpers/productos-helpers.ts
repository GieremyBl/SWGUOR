import type { ApiResponse } from '@/lib/schemas/productos';

const API = '/api/admin/productos';

export async function fetchProductos(params?: {
  categoriaId?: string;
  estado?:      string;
  busqueda?:    string;
  color?:       string;
  talla?:       string;
  sortOrder?:   'asc' | 'desc' | 'none';
}): Promise<{ productos: Record<string, unknown>[]; categorias: Record<string, unknown>[] }> {
  const query = new URLSearchParams();
  if (params?.categoriaId)                               query.set('categoria_id', params.categoriaId);
  if (params?.estado)                                    query.set('estado',       params.estado);
  if (params?.busqueda)                                  query.set('busqueda',     params.busqueda);
  if (params?.color)                                     query.set('color',        params.color);
  if (params?.talla)                                     query.set('talla',        params.talla);
  if (params?.sortOrder && params.sortOrder !== 'none') query.set('sort', params.sortOrder);

  const res = await fetch(`${API}?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar productos');
  return res.json();
}

export async function fetchProductoById(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Producto no encontrado');
  const result = await res.json();
  return result.data ?? result;
}

export async function createProducto(data: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return res.json();
}

export async function updateProducto(
  id: string,
  data: { estado?: string; nombre?: string; precio?: number; stock?: number; categoria_id?: string }
): Promise<ApiResponse> {
  const res = await fetch(`${API}/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return res.json();
}

export async function toggleEstadoProducto(
  id: string,
  estado: 'activo' | 'inactivo'
): Promise<ApiResponse> {
  const res = await fetch(`${API}/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ estado }),
  });
  return res.json();
}

export async function deleteProducto(id: string): Promise<ApiResponse> {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  return res.json();
}