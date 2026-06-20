import { DEVOLUCIONES_PROVEEDOR_API } from '@/lib/constants/devoluciones-proveedor';
import type {
  ActualizarEstadoDevolucionProveedorInput,
  CrearDevolucionProveedorInput,
  DevolucionProveedorFila,
} from '@/lib/schemas/devoluciones-proveedor';

export interface ListarDevolucionesProveedorParams {
  estado?: string;
  proveedor_id?: string;
  busqueda?: string;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? 'Error en la solicitud');
  }
  return json as T;
}

export async function fetchDevolucionesProveedor(
  params?: ListarDevolucionesProveedorParams,
): Promise<DevolucionProveedorFila[]> {
  const search = new URLSearchParams();
  if (params?.estado && params.estado !== 'todos') search.set('estado', params.estado);
  if (params?.proveedor_id) search.set('proveedor_id', params.proveedor_id);
  if (params?.busqueda) search.set('busqueda', params.busqueda);

  const res = await fetch(`${DEVOLUCIONES_PROVEEDOR_API}?${search}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: DevolucionProveedorFila[] }>(res);
  return json.data ?? [];
}

export async function fetchDevolucionProveedorById(
  id: string | number,
): Promise<DevolucionProveedorFila> {
  const res = await fetch(`${DEVOLUCIONES_PROVEEDOR_API}/${id}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: DevolucionProveedorFila }>(res);
  return json.data;
}

export async function createDevolucionProveedor(
  payload: CrearDevolucionProveedorInput,
): Promise<DevolucionProveedorFila> {
  const res = await fetch(DEVOLUCIONES_PROVEEDOR_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: DevolucionProveedorFila }>(res);
  return json.data;
}

export async function updateEstadoDevolucionProveedor(
  id: string | number,
  payload: ActualizarEstadoDevolucionProveedorInput,
): Promise<DevolucionProveedorFila> {
  const res = await fetch(`${DEVOLUCIONES_PROVEEDOR_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: DevolucionProveedorFila }>(res);
  return json.data;
}
