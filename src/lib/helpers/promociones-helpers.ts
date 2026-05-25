import type {
  ApiItemResponse,
  ApiListResponse,
  CampanaForm,
  CampanaRow,
  ReglaDescuentoForm,
  ReglaDescuentoRow,
} from '@/lib/schemas/promociones-ofertas';

const REGLAS_API = '/api/admin/reglas-descuento';
const PROMOS_API = '/api/admin/promociones';
const OFERTAS_API = '/api/admin/ofertas';

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, v);
  });
  return q.toString();
}

// ── Reglas ────────────────────────────────────────────────────

export async function fetchReglasDescuento(
  page: number,
  limit: number,
  busqueda: string,
  activoFilter: string,
): Promise<ApiListResponse<ReglaDescuentoRow>> {
  const qs = buildQuery({
    page: String(page),
    limit: String(limit),
    busqueda: busqueda || undefined,
    activo: activoFilter || undefined,
  });
  const res = await fetch(`${REGLAS_API}?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar reglas');
  return res.json();
}

export async function fetchReglasActivas(): Promise<ApiListResponse<ReglaDescuentoRow>> {
  const res = await fetch(`${REGLAS_API}?activas=1`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar reglas activas');
  return res.json();
}

export async function saveReglaDescuento(
  data: ReglaDescuentoForm,
): Promise<ApiItemResponse<ReglaDescuentoRow>> {
  const isEdit = Boolean(data.id);
  const url = isEdit ? `${REGLAS_API}/${data.id}` : REGLAS_API;
  const res = await fetch(url, {
    method: isEdit ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deactivateReglaDescuento(
  id: string | number,
): Promise<ApiItemResponse<ReglaDescuentoRow>> {
  const res = await fetch(`${REGLAS_API}/${id}`, { method: 'DELETE' });
  return res.json();
}

// ── Promociones ─────────────────────────────────────────────

export async function fetchPromociones(
  page: number,
  limit: number,
  busqueda: string,
  activoFilter: string,
): Promise<ApiListResponse<CampanaRow>> {
  const qs = buildQuery({
    page: String(page),
    limit: String(limit),
    busqueda: busqueda || undefined,
    activo: activoFilter || undefined,
  });
  const res = await fetch(`${PROMOS_API}?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar promociones');
  return res.json();
}

export async function fetchPromocionDetalle(
  id: string | number,
): Promise<ApiItemResponse<CampanaRow>> {
  const res = await fetch(`${PROMOS_API}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar promoción');
  return res.json();
}

export async function savePromocion(
  data: CampanaForm,
): Promise<ApiItemResponse<CampanaRow>> {
  const isEdit = Boolean(data.id);
  const url = isEdit ? `${PROMOS_API}/${data.id}` : PROMOS_API;
  const res = await fetch(url, {
    method: isEdit ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deactivatePromocion(
  id: string | number,
): Promise<ApiItemResponse<CampanaRow>> {
  const res = await fetch(`${PROMOS_API}/${id}`, { method: 'DELETE' });
  return res.json();
}

// ── Ofertas ───────────────────────────────────────────────────

export async function fetchOfertas(
  page: number,
  limit: number,
  busqueda: string,
  activoFilter: string,
): Promise<ApiListResponse<CampanaRow>> {
  const qs = buildQuery({
    page: String(page),
    limit: String(limit),
    busqueda: busqueda || undefined,
    activo: activoFilter || undefined,
  });
  const res = await fetch(`${OFERTAS_API}?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar ofertas');
  return res.json();
}

export async function fetchOfertaDetalle(
  id: string | number,
): Promise<ApiItemResponse<CampanaRow>> {
  const res = await fetch(`${OFERTAS_API}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar oferta');
  return res.json();
}

export async function saveOferta(
  data: CampanaForm,
): Promise<ApiItemResponse<CampanaRow>> {
  const isEdit = Boolean(data.id);
  const url = isEdit ? `${OFERTAS_API}/${data.id}` : OFERTAS_API;
  const res = await fetch(url, {
    method: isEdit ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deactivateOferta(
  id: string | number,
): Promise<ApiItemResponse<CampanaRow>> {
  const res = await fetch(`${OFERTAS_API}/${id}`, { method: 'DELETE' });
  return res.json();
}
