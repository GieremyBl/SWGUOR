import { PrecioHistorico } from '@/lib/schemas/precio-historico';

const baseUrl = '/api/admin/precio-historico';

export type CreatePrecioHistoricoInput = Omit<PrecioHistorico, 'id' | 'fechaCreacion'> & Record<string, unknown>;
export type UpdatePrecioHistoricoInput = Partial<PrecioHistorico> & Record<string, unknown>;

export async function fetchPrecioHistorico(productoId?: string): Promise<PrecioHistorico[]> {
  const url = productoId ? `${baseUrl}?producto_id=${encodeURIComponent(productoId)}` : baseUrl;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al obtener el histórico de precios');
  const payload = await response.json();
  return payload.data ?? payload;
}

export async function createPrecioHistorico(data: CreatePrecioHistoricoInput): Promise<Record<string, unknown>> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al crear el histórico de precios');
  return response.json();
}

export async function updatePrecioHistorico(id: string, data: UpdatePrecioHistoricoInput): Promise<Record<string, unknown>> {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al actualizar el histórico de precios');
  return response.json();
}

export async function deletePrecioHistorico(id: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Error al eliminar el histórico de precios');
  return response.json();
}

export const precioHistoricoHelpers = {
  calcularVariacion: (actual: PrecioHistorico): number =>
    ((actual.precioNuevo - actual.precioAnterior) / actual.precioAnterior) * 100,

  esAumento: (historico: PrecioHistorico): boolean =>
    historico.precioNuevo > historico.precioAnterior,

  obtenerPrecioPromedio: (precios: PrecioHistorico[]): number => {
    if (precios.length === 0) return 0;
    return precios.reduce((sum, p) => sum + p.precioNuevo, 0) / precios.length;
  },

  obtenerPrecioMaximo: (precios: PrecioHistorico[]): PrecioHistorico | undefined => {
    if (precios.length === 0) return undefined;
    return precios.reduce((prev, curr) => (curr.precioNuevo > prev.precioNuevo ? curr : prev));
  },

  obtenerPrecioMinimo: (precios: PrecioHistorico[]): PrecioHistorico | undefined => {
    if (precios.length === 0) return undefined;
    return precios.reduce((prev, curr) => (curr.precioNuevo < prev.precioNuevo ? curr : prev));
  },

  agruparPorRazon: (precios: PrecioHistorico[]): Record<string, PrecioHistorico[]> =>
    precios.reduce((acc, curr) => {
      if (!acc[curr.razonCambio]) acc[curr.razonCambio] = [];
      acc[curr.razonCambio].push(curr);
      return acc;
    }, {} as Record<string, PrecioHistorico[]>),

  obtenerTrendencia: (precios: PrecioHistorico[]): 'SUBIDA' | 'BAJADA' | 'ESTABLE' => {
    if (precios.length < 2) return 'ESTABLE';
    const ultimos = precios.slice(0, 3);
    const subidas = ultimos.filter((_, i) => i > 0 && precioHistoricoHelpers.esAumento(ultimos[i])).length;
    if (subidas >= 2) return 'SUBIDA';
    if (subidas === 0) return 'BAJADA';
    return 'ESTABLE';
  },

  formatearPrecio: (precio: number, moneda: string = 'PEN'): string => {
    const simbolo: Record<string, string> = { PEN: 'S/', USD: '$', EUR: '€' };
    const prefijo = simbolo[moneda] || moneda;
    return `${prefijo} ${precio.toFixed(2)}`;
  },
};