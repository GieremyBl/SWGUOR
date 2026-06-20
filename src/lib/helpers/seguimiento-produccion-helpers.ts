import type {
  RegistrarEtapaPayload,
  SeguimientoProduccionRow,
} from '@/lib/schemas/seguimiento-produccion';

const API = '/api/admin/seguimiento-produccion';

interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function fetchSeguimientosProduccion(
  orden_id: string,
): Promise<SeguimientoProduccionRow[]> {
  const res = await fetch(`${API}?orden_id=${orden_id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar seguimientos');
  const result = await res.json();
  return (result.data ?? []) as SeguimientoProduccionRow[];
}

export async function registrarSeguimientoProduccion(
  data: RegistrarEtapaPayload,
): Promise<ApiResponse<SeguimientoProduccionRow>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function actualizarSeguimientoProduccion(
  id: string,
  data: { observaciones?: string | null },
): Promise<ApiResponse<SeguimientoProduccionRow>> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export function nombreUsuarioSeguimiento(
  usuario?: SeguimientoProduccionRow['usuarios'] | null,
): string {
  if (!usuario) return 'Sistema';
  return usuario.email ?? 'Usuario';
}

export function etapaActualDesdeSeguimiento(
  seguimientos: SeguimientoProduccionRow[],
  fallbackEtapa?: string | null,
): string {
  const activo = seguimientos.find((s) => s.activo);
  if (activo?.etapa) return activo.etapa;
  if (seguimientos[0]?.etapa) return seguimientos[0].etapa;
  return fallbackEtapa ?? 'diseno';
}
