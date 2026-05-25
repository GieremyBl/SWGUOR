import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { CampanaForm } from '@/lib/schemas/promociones-ofertas';

export interface CampanaFilters {
  activo?: boolean;
  busqueda?: string;
  page?: number;
  limit?: number;
}

const INCLUDE_REGLAS = {
  oferta_reglas: {
    orderBy: { prioridad: 'asc' as const },
    include: {
      reglas_descuento: {
        include: { categorias: { select: { id: true, nombre: true } } },
      },
    },
  },
} as const;

function toDate(value: string): Date {
  return new Date(value);
}

function mapCampanaData(input: CampanaForm) {
  return {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    activo: input.activo ?? true,
    fecha_inicio: toDate(input.fecha_inicio),
    fecha_fin: input.fecha_fin ? toDate(input.fecha_fin) : null,
  };
}

async function syncReglas(
  tx: Prisma.TransactionClient,
  ofertaId: bigint,
  reglas: CampanaForm['reglas'],
) {
  await tx.oferta_reglas.deleteMany({ where: { oferta_id: ofertaId } });
  if (!reglas?.length) return;
  await tx.oferta_reglas.createMany({
    data: reglas.map((r, idx) => ({
      oferta_id: ofertaId,
      regla_id: BigInt(r.regla_id),
      prioridad: r.prioridad ?? idx + 1,
    })),
  });
}

export const ofertasService = {
  async listar(filters: CampanaFilters = {}) {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;
    const where: Prisma.ofertasWhereInput = {};

    if (filters.activo !== undefined) where.activo = filters.activo;
    if (filters.busqueda) {
      where.nombre = { contains: filters.busqueda, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.ofertas.findMany({
        where,
        include: {
          oferta_reglas: { select: { regla_id: true, prioridad: true } },
        },
        orderBy: [{ activo: 'desc' }, { fecha_inicio: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.ofertas.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  },

  async obtenerPorId(id: bigint) {
    return prisma.ofertas.findUnique({
      where: { id },
      include: INCLUDE_REGLAS,
    });
  },

  async crear(input: CampanaForm) {
    return prisma.$transaction(async (tx) => {
      const oferta = await tx.ofertas.create({
        data: mapCampanaData(input),
      });
      await syncReglas(tx, oferta.id, input.reglas);
      return tx.ofertas.findUnique({
        where: { id: oferta.id },
        include: INCLUDE_REGLAS,
      });
    });
  },

  async actualizar(id: bigint, input: CampanaForm) {
    return prisma.$transaction(async (tx) => {
      await tx.ofertas.update({
        where: { id },
        data: mapCampanaData(input),
      });
      await syncReglas(tx, id, input.reglas);
      return tx.ofertas.findUnique({
        where: { id },
        include: INCLUDE_REGLAS,
      });
    });
  },

  async desactivar(id: bigint) {
    return prisma.ofertas.update({
      where: { id },
      data: { activo: false },
      include: INCLUDE_REGLAS,
    });
  },
};
