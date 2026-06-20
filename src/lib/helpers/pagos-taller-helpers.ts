import { PAGOS_TALLER_ADMIN_API } from '@/lib/constants/pagos-taller';
import type {
  ActualizarPagoTallerInput,
  AnularPagoTallerInput,
  CrearPagoTallerInput,
  PagoTallerFila,
  PagosTallerListResponse,
  RegistrarPagoTallerInput,
} from '@/lib/schemas/pagos-talleres';

export const PAGOS_TALLER_KEY = 'pagos-taller';

export interface ListarPagosTallerParams {
  taller_id?: string;
  confeccion_id?: string;
  orden_produccion_id?: string;
  estado?: string;
  metodo_pago?: string;
  search?: string;
  page?: number;
  limit?: number;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? 'Error en la solicitud');
  }
  return json as T;
}

export async function fetchPagosTaller(
  params?: ListarPagosTallerParams,
): Promise<PagosTallerListResponse> {
  const search = new URLSearchParams();
  if (params?.taller_id && params.taller_id !== 'todos') search.set('taller_id', params.taller_id);
  if (params?.confeccion_id) search.set('confeccion_id', params.confeccion_id);
  if (params?.orden_produccion_id) search.set('orden_produccion_id', params.orden_produccion_id);
  if (params?.estado && params.estado !== 'todos') search.set('estado', params.estado);
  if (params?.metodo_pago && params.metodo_pago !== 'todos') search.set('metodo_pago', params.metodo_pago);
  if (params?.search) search.set('search', params.search);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));

  const qs = search.toString();
  const res = await fetch(`${PAGOS_TALLER_ADMIN_API}${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: PagoTallerFila[]; meta: PagosTallerListResponse['meta'] }>(res);
  return { data: json.data ?? [], meta: json.meta };
}

export async function fetchPagoTallerById(id: string | number): Promise<PagoTallerFila> {
  const res = await fetch(`${PAGOS_TALLER_ADMIN_API}/${id}`, { cache: 'no-store' });
  const json = await parseResponse<{ success: boolean; data: PagoTallerFila }>(res);
  return json.data;
}

export async function crearPagoTaller(payload: CrearPagoTallerInput): Promise<PagoTallerFila> {
  const res = await fetch(PAGOS_TALLER_ADMIN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: PagoTallerFila }>(res);
  return json.data;
}

export async function actualizarPagoTaller(
  id: string | number,
  payload: ActualizarPagoTallerInput,
): Promise<PagoTallerFila> {
  const res = await fetch(`${PAGOS_TALLER_ADMIN_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await parseResponse<{ success: boolean; data: PagoTallerFila }>(res);
  return json.data;
}

export async function registrarPagoTaller(
  id: string | number,
  payload: RegistrarPagoTallerInput,
): Promise<PagoTallerFila> {
  const res = await fetch(`${PAGOS_TALLER_ADMIN_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'registrar', ...payload }),
  });
  const json = await parseResponse<{ success: boolean; data: PagoTallerFila }>(res);
  return json.data;
}

export async function anularPagoTaller(
  id: string | number,
  payload?: AnularPagoTallerInput,
): Promise<PagoTallerFila> {
  const res = await fetch(`${PAGOS_TALLER_ADMIN_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'anular', ...payload }),
  });
  const json = await parseResponse<{ success: boolean; data: PagoTallerFila }>(res);
  return json.data;
}

export function formatMontoPagoTaller(monto: number | string, moneda = 'PEN'): string {
  const valor = Number(monto);
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: moneda,
  }).format(valor);
}
