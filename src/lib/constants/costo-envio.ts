import type { RolUsuario } from '@/lib/constants/roles';
import { ZONA_ENVIO_PORTAL_TO_DB, type ZonaEnvioPortal } from '@/lib/constants/zona-envio';
import { ZonaEnvio } from '@prisma/client';

export const COSTO_ENVIO_ADMIN_API = '/api/admin/costo-envio';

export const COSTO_ENVIO_ROLES_VER: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
];

export const COSTO_ENVIO_ROLES_ESCRITURA: RolUsuario[] = [
  'administrador',
  'gerente',
];

export const ZONAS_ENVIO_DISPONIBLES = [
  'cercana_sjl',
  'media',
  'lejana',
] as const satisfies readonly ZonaEnvioPortal[];

export const ZONA_ENVIO_LABELS: Record<ZonaEnvio, string> = {
  [ZonaEnvio.Cercana_a_SJL]: 'Cercana a SJL',
  [ZonaEnvio.Zona_media]: 'Zona media',
  [ZonaEnvio.Zona_lejana]: 'Zona lejana',
};

export function normalizarZonaEnvioDb(zona: string): string {
  const portal = ZONA_ENVIO_PORTAL_TO_DB[zona as ZonaEnvioPortal];
  if (portal) return portal;
  if (Object.values(ZONA_ENVIO_PORTAL_TO_DB).includes(zona)) return zona;
  return zona;
}

export function etiquetaZonaEnvio(zona: string): string {
  return ZONA_ENVIO_LABELS[zona as ZonaEnvio] ?? zona.replace(/_/g, ' ');
}
