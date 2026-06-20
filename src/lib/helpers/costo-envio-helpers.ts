import { COSTO_ENVIO_ADMIN_API } from '@/lib/constants/costo-envio';
import type {
  ActualizarCostoEnvioInput,
  CostoEnvioFila,
  CrearCostoEnvioInput,
} from '@/lib/schemas/costo-envio';

export const COSTO_ENVIO_KEY = 'costo-envio';

export interface ListarCostoEnvioParams {
  activo?: string;
  search?: string;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? 'Error en la solicitud');
  }
  return json as T;
}

export async function fetchCostosEnvio(
  params?: ListarCostoEnvioParams,
): Promise<CostoEnvioFila[]> {
  const search = new URLSearchParams();
  if (params?.activo && params.activo !== 'todos') {
    search.set('activo', params.activo);
  }
  if (params?.search) search.set('search', params.search);

  const qs = search.toString();
  const res = await fetch(`${COSTO_ENVIO_ADMIN_API}${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
  const json = await parseResponse<{ success: boolean; data: CostoEnvioFila[] }>(res);
  return json.data ?? [];
}

export async function fetchCostoEnvioById(id: number): Promise<CostoEnvioFila> {
  const res = await fetch(`${COSTO_ENVIO_ADMIN_API}/${id}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: CostoEnvioFila }>(res);
  return json.data;
}

export async function crearCostoEnvio(payload: CrearCostoEnvioInput): Promise<CostoEnvioFila> {
  const res = await fetch(COSTO_ENVIO_ADMIN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: CostoEnvioFila }>(res);
  return json.data;
}

export async function actualizarCostoEnvio(
  id: number,
  payload: ActualizarCostoEnvioInput,
): Promise<CostoEnvioFila> {
  const res = await fetch(`${COSTO_ENVIO_ADMIN_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: CostoEnvioFila }>(res);
  return json.data;
}

export async function desactivarCostoEnvio(id: number): Promise<CostoEnvioFila> {
  const res = await fetch(`${COSTO_ENVIO_ADMIN_API}/${id}`, { method: 'DELETE' });
  const json = await parseResponse<{ success: boolean; data: CostoEnvioFila }>(res);
  return json.data;
}

export function formatCostoEnvio(monto: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(monto);
}
