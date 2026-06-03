import type { CreateCotizacionInput } from '@/lib/schemas/cotizaciones';

const API = '/api/admin/cotizaciones';

export async function fetchCotizaciones(estado?: string): Promise<any[]> {
  const params = estado && estado !== 'todos' ? `?estado=${estado}` : '';
  const res    = await fetch(`${API}${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar cotizaciones');
  const result = await res.json();
  return result.data ?? [];
}

export async function fetchCotizacionById(id: string): Promise<any> {
  const res = await fetch(`${API}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Cotización no encontrada');
  const result = await res.json();
  return result.data;
}

export async function createCotizacion(
  data: Omit<CreateCotizacionInput, 'empresa' | 'contacto' | 'tipo_destino' |
    'vendedor' | 'tipo_venta' | 'unidad_negocio' | 'forma_pago' | 'metodo' |
    'direccion_entrega' | 'direccion_factura' | 'condicion_entrega' |
    'tiempo_entrega' | 'idioma' | 'referencia' | 'probabilidad' | 'fecha_cierre'> & {
    estado_inicial?: 'borrador' | 'enviada';
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await fetch(API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return res.json();
}

export async function actualizarEstadoCotizacion(
  id: string,
  estado: string,
  motivo?: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API}/${id}/estado`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ estado, motivo }),
  });
  return res.json();
}

export async function aprobarCotizacion(
  id: string,
  items?: { item_id: number; precio_unitario: number }[],
): Promise<{ success: boolean; pedidoId?: number; error?: string }> {
  const res = await fetch(`${API}/${id}/aprobar`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(items?.length ? { items } : {}),
  });
  return res.json();
}

export async function rechazarCotizacion(
  id: string,
  motivo?: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API}/${id}/rechazar`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ motivo }),
  });
  return res.json();
}

export async function fetchProductosCotizacion(): Promise<any[]> {
  const res = await fetch(`${API}/productos`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar productos');
  const result = await res.json();
  return result.data ?? [];
}

export async function fetchClientesCotizacion(): Promise<any[]> {
  const res = await fetch(`${API}/clientes`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar clientes');
  const result = await res.json();
  return result.data ?? [];
}