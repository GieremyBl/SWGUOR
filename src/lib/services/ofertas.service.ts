import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { CampanaConEscalasForm } from '@/lib/schemas/promociones-ofertas';
import {
  limpiarVinculosCampana,
  obtenerReglaIdsCampana,
  syncCampanaEscalas,
} from '@/lib/services/campana-escalas.service';
import { ESTADO_DESCUENTO_APLICACION } from '@/lib/constants/promociones';

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
        include: {
          descuento_aplicaciones: {
            where: { estado: { not: ESTADO_DESCUENTO_APLICACION.REVERTIDO } },
          },
        },
      },
    },
  },
} as const;

function toDate(value: string): Date {
  return new Date(value);
}

function mapCampanaData(input: CampanaConEscalasForm) {
  return {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    activo: input.activo ?? true,
    fecha_inicio: toDate(input.fecha_inicio),
    fecha_fin: input.fecha_fin ? toDate(input.fecha_fin) : null,
  };
}

function buildSyncInput(
  ofertaId: bigint,
  input: CampanaConEscalasForm,
): Parameters<typeof syncCampanaEscalas>[1] {
  return {
    campanaTipo: 'oferta',
    campanaId: ofertaId,
    campanaNombre: input.nombre,
    fechaInicio: toDate(input.fecha_inicio),
    fechaFin: input.fecha_fin ? toDate(input.fecha_fin) : null,
    alcance: input.alcance,
    categoriaId: input.categoria_id ? BigInt(input.categoria_id) : null,
    productoId: input.producto_id ? BigInt(input.producto_id) : null,
    escalas: input.escalas,
  };
}

async function aplicarEscalas(
  tx: Prisma.TransactionClient,
  ofertaId: bigint,
  input: CampanaConEscalasForm,
  previousReglaIds: bigint[],
) {
  await limpiarVinculosCampana(tx, 'oferta', ofertaId);
  await syncCampanaEscalas(tx, buildSyncInput(ofertaId, input), previousReglaIds);
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

  async crear(input: CampanaConEscalasForm) {
    return prisma.$transaction(async (tx) => {
      const oferta = await tx.ofertas.create({
        data: mapCampanaData(input),
      });
      await aplicarEscalas(tx, oferta.id, input, []);
      return tx.ofertas.findUnique({
        where: { id: oferta.id },
        include: INCLUDE_REGLAS,
      });
    });
  },

  async actualizar(id: bigint, input: CampanaConEscalasForm) {
    return prisma.$transaction(async (tx) => {
      const previousIds = await obtenerReglaIdsCampana(tx, 'oferta', id);
      await tx.ofertas.update({
        where: { id },
        data: mapCampanaData(input),
      });
      await aplicarEscalas(tx, id, input, previousIds);
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
