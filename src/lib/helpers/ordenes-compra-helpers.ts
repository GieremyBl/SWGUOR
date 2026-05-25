import type {
  CrearOrdenCompra,
  CrearOrdenDesdeCotizacion,
  ActualizarOrdenCompra,
} from '@/lib/schemas/ordenes-compra';

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const json = await res.json();
  if (!res.ok) {
    return { success: false, error: json.error || 'Error en la solicitud' };
  }
  return { success: true, data: json.data };
}

export async function fetchOrdenesCompra(params?: Record<string, string>) {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const res = await fetch(`/api/admin/ordenes-compra${qs}`);
  return parseResponse<unknown[]>(res);
}

export async function fetchOrdenCompraById(id: string | number) {
  const res = await fetch(`/api/admin/ordenes-compra/${id}`);
  return parseResponse<unknown>(res);
}

export async function crearOrdenCompra(datos: CrearOrdenCompra) {
  const res = await fetch('/api/admin/ordenes-compra', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return parseResponse<unknown>(res);
}

export async function crearOrdenDesdeCotizacion(datos: CrearOrdenDesdeCotizacion) {
  const res = await fetch('/api/admin/ordenes-compra/desde-cotizacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return parseResponse<unknown>(res);
}

export async function actualizarOrdenCompra(
  id: string | number,
  datos: ActualizarOrdenCompra,
) {
  const res = await fetch(`/api/admin/ordenes-compra/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return parseResponse<unknown>(res);
}

export async function confirmarOrdenCompra(id: string | number) {
  const res = await fetch(`/api/admin/ordenes-compra/${id}/confirmar`, {
    method: 'POST',
  });
  return parseResponse<unknown>(res);
}

export async function cancelarOrdenCompra(id: string | number) {
  const res = await fetch(`/api/admin/ordenes-compra/${id}/cancelar`, {
    method: 'POST',
  });
  return parseResponse<unknown>(res);
}

export function formatNumeroOc(id: string | number): string {
  return `OC-${id}`;
}
