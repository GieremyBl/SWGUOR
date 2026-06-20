import type {
  RegistrarSeguimientoConfeccionPayload,
  SeguimientoConfeccionRow,
  ApiResponse,
} from '@/lib/schemas/seguimiento-confeccion';

export const SEGUIMIENTO_CONFECCION_KEY = 'seguimiento-confeccion';

const API = '/api/admin/seguimiento-confeccion';

export async function fetchSeguimientosConfeccion(
  confeccion_id: string,
): Promise<SeguimientoConfeccionRow[]> {
  const res = await fetch(`${API}?confeccion_id=${confeccion_id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar seguimientos');
  const result = await res.json();
  return (result.data ?? []) as SeguimientoConfeccionRow[];
}

export async function registrarSeguimientoConfeccion(
  data: RegistrarSeguimientoConfeccionPayload,
): Promise<ApiResponse<SeguimientoConfeccionRow>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function actualizarSeguimientoConfeccion(
  id: string,
  data: { notas?: string | null },
): Promise<ApiResponse<SeguimientoConfeccionRow>> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export function nombreResponsableSeguimiento(
  usuario?: SeguimientoConfeccionRow['usuarios'] | null,
): string {
  if (!usuario) return 'Sistema';
  return usuario.email ?? 'Usuario';
}
