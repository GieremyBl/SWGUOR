import { prisma } from '@/lib/prisma';
import { normalizarZonaEnvioDb } from '@/lib/constants/costo-envio';
import { serializeBigInt } from '@/lib/utils/serialize';

type CostoEnvioRowDb = {
  id: number;
  zona: string;
  costo: unknown;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

function mapRow(row: CostoEnvioRowDb) {
  return {
    id: row.id,
    zona: row.zona,
    costo: Number(row.costo),
    activo: row.activo,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export const CostoEnvioService = {
  async listar(params?: { activo?: boolean; search?: string }) {
    const { activo, search } = params ?? {};

    const rows = await prisma.$queryRaw<CostoEnvioRowDb[]>`
      SELECT id, zona::text AS zona, costo, activo, created_at, updated_at
      FROM public.costo_envio
      WHERE (${activo === undefined} OR activo = ${activo ?? true})
      ORDER BY id ASC
    `;

    let data = rows.map(mapRow);

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) => r.zona.toLowerCase().includes(q) || String(r.id).includes(q),
      );
    }

    return serializeBigInt(data);
  },

  async obtenerPorId(id: number) {
    const rows = await prisma.$queryRaw<CostoEnvioRowDb[]>`
      SELECT id, zona::text AS zona, costo, activo, created_at, updated_at
      FROM public.costo_envio
      WHERE id = ${id}
      LIMIT 1
    `;
    const row = rows[0];
    return row ? serializeBigInt(mapRow(row)) : null;
  },

  async crear(data: { zona: string; costo: number; activo?: boolean }) {
    const zonaDb = normalizarZonaEnvioDb(data.zona);

    const existente = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM public.costo_envio
      WHERE zona::text = ${zonaDb}
      LIMIT 1
    `;
    if (existente[0]) {
      throw new Error('Ya existe un costo configurado para esta zona');
    }

    const rows = await prisma.$queryRaw<CostoEnvioRowDb[]>`
      INSERT INTO public.costo_envio (zona, costo, activo)
      VALUES (${zonaDb}::"ZonaEnvio", ${data.costo}, ${data.activo ?? true})
      RETURNING id, zona::text AS zona, costo, activo, created_at, updated_at
    `;

    return serializeBigInt(mapRow(rows[0]));
  },

  async actualizar(id: number, data: { costo?: number; activo?: boolean }) {
    const actual = await CostoEnvioService.obtenerPorId(id);
    if (!actual) throw new Error('Zona de envío no encontrada');

    const costo = data.costo ?? actual.costo;
    const activo = data.activo ?? actual.activo;

    const rows = await prisma.$queryRaw<CostoEnvioRowDb[]>`
      UPDATE public.costo_envio
      SET costo = ${costo}, activo = ${activo}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, zona::text AS zona, costo, activo, created_at, updated_at
    `;

    return serializeBigInt(mapRow(rows[0]));
  },

  async desactivar(id: number) {
    return CostoEnvioService.actualizar(id, { activo: false });
  },

  async listarActivos() {
    return CostoEnvioService.listar({ activo: true });
  },
};
