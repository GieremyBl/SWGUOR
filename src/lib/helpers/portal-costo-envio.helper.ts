import { prisma } from '@/lib/prisma';
import { costoEnvioMatchesPortalZona } from '@/lib/constants/zona-envio';

export type CostoEnvioResuelto = {
  zona_envio_id: number | null;
  costo_envio: number;
};

type CostoEnvioRow = {
  id: number;
  costo: unknown;
  zona: string;
};

/**
 * Lee costo_envio sin deserializar el enum ZonaEnvio en Prisma
 * (BD: "Cercana a SJL" vs cliente Prisma: cercana_sjl).
 */
async function listarCostoEnvioActivo(): Promise<CostoEnvioRow[]> {
  return prisma.$queryRaw<CostoEnvioRow[]>`
    SELECT id, costo, zona::text AS zona
    FROM public.costo_envio
    WHERE activo = true
    ORDER BY id
  `;
}

async function obtenerCostoEnvioPorId(id: number): Promise<CostoEnvioRow | null> {
  const rows = await prisma.$queryRaw<CostoEnvioRow[]>`
    SELECT id, costo, zona::text AS zona
    FROM public.costo_envio
    WHERE id = ${id} AND activo = true
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Resuelve costo e ID de zona evitando el enum ZonaEnvio del cliente Prisma.
 */
export async function resolverCostoEnvioPedido(input: {
  zona_envio_id?: number | null;
  zona_envio?: string | null;
  costo_envio?: number | null;
}): Promise<CostoEnvioResuelto> {
  const costoEnviado = Number(input.costo_envio);
  const tieneCostoEnviado = Number.isFinite(costoEnviado) && costoEnviado >= 0;

  if (input.zona_envio_id != null) {
    const porId = await obtenerCostoEnvioPorId(Number(input.zona_envio_id));
    if (porId) {
      return {
        zona_envio_id: porId.id,
        costo_envio: Number(porId.costo),
      };
    }
    if (tieneCostoEnviado) {
      return {
        zona_envio_id: Number(input.zona_envio_id),
        costo_envio: costoEnviado,
      };
    }
  }

  if (input.zona_envio) {
    const filas = await listarCostoEnvioActivo();
    const match = filas.find((f) =>
      costoEnvioMatchesPortalZona(f.zona, input.zona_envio!),
    );
    if (match) {
      return { zona_envio_id: match.id, costo_envio: Number(match.costo) };
    }
  }

  if (tieneCostoEnviado) {
    return { zona_envio_id: input.zona_envio_id ?? null, costo_envio: costoEnviado };
  }

  return { zona_envio_id: null, costo_envio: 0 };
}
