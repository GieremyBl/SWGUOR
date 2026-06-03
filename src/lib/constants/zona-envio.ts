/** Claves internas del portal (PortalContext / UI). */
export type ZonaEnvioPortal = 'cercana_sjl' | 'media' | 'lejana';

/**
 * Valores reales del enum `ZonaEnvio` en PostgreSQL (ver types/database.ts).
 * El schema introspectado de Prisma puede diferir; la BD es la fuente de verdad.
 */
export const ZONA_ENVIO_PORTAL_TO_DB: Record<ZonaEnvioPortal, string> = {
  cercana_sjl: 'Cercana a SJL',
  media: 'Zona media',
  lejana: 'Zona lejana',
};

const DB_TO_PORTAL = Object.fromEntries(
  Object.entries(ZONA_ENVIO_PORTAL_TO_DB).map(([portal, db]) => [db, portal]),
) as Record<string, ZonaEnvioPortal>;

/** Indica si una fila de costo_envio corresponde a la zona elegida en el portal. */
export function costoEnvioMatchesPortalZona(
  rowZona: unknown,
  portalZona: string,
): boolean {
  const z = String(rowZona);
  const dbLabel = ZONA_ENVIO_PORTAL_TO_DB[portalZona as ZonaEnvioPortal];
  if (dbLabel && z === dbLabel) return true;
  if (z === portalZona) return true;
  if (DB_TO_PORTAL[z] === portalZona) return true;
  return false;
}
