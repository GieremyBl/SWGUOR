import type {
  TarifaTallerForm,
  TarifaTallerRow,
  ApiResponse,
} from '@/lib/schemas/tarifa-talleres';

const API = '/api/admin/tarifas-taller';

export async function fetchTarifasTaller(params?: {
  taller_id?: string;
  especialidad?: string;
  activo?: boolean | 'all';
}): Promise<TarifaTallerRow[]> {
  const query = new URLSearchParams();
  if (params?.taller_id) query.set('taller_id', params.taller_id);
  if (params?.especialidad) query.set('especialidad', params.especialidad);
  if (params?.activo !== undefined && params.activo !== 'all') {
    query.set('activo', String(params.activo));
  }

  const qs = query.toString();
  const res = await fetch(`${API}${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar tarifas');
  const result = await res.json();
  return (result.data ?? []) as TarifaTallerRow[];
}

export async function crearTarifaTaller(
  data: TarifaTallerForm,
): Promise<ApiResponse<TarifaTallerRow>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function actualizarTarifaTaller(
  id: string,
  data: Partial<TarifaTallerForm>,
): Promise<ApiResponse<TarifaTallerRow>> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function desactivarTarifaTaller(id: string): Promise<ApiResponse> {
  const res = await fetch(`${API}?id=${id}`, { method: 'DELETE' });
  return res.json();
}

export async function calcularCostoTarifaTaller(
  id: string,
  cantidad: number,
): Promise<ApiResponse<{ costo: number; precio_unitario: number; cantidad: number; moneda: string }>> {
  const res = await fetch(`${API}/${id}/calcular-costo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad }),
  });
  return res.json();
}

export function estaVigente(tarifa: TarifaTallerRow, ref = new Date()): boolean {
  const desde = new Date(tarifa.vigente_desde);
  const desdeOk = ref >= desde;
  const hastaOk = !tarifa.vigente_hasta || ref <= new Date(tarifa.vigente_hasta);
  return desdeOk && hastaOk;
}

export function estaActivaYVigente(tarifa: TarifaTallerRow, ref = new Date()): boolean {
  return tarifa.activo && estaVigente(tarifa, ref);
}
