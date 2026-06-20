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
  promocion_reglas: {
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
  promocionId: bigint,
  input: CampanaConEscalasForm,
): Parameters<typeof syncCampanaEscalas>[1] {
  return {
    campanaTipo: 'promocion',
    campanaId: promocionId,
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
  promocionId: bigint,
  input: CampanaConEscalasForm,
  previousReglaIds: bigint[],
) {
  await limpiarVinculosCampana(tx, 'promocion', promocionId);
  await syncCampanaEscalas(tx, buildSyncInput(promocionId, input), previousReglaIds);
}

export const promocionesService = {
  async listar(filters: CampanaFilters = {}) {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;
    const where: Prisma.promocionesWhereInput = {};

    if (filters.activo !== undefined) where.activo = filters.activo;
    if (filters.busqueda) {
      where.nombre = { contains: filters.busqueda, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.promociones.findMany({
        where,
        include: {
          promocion_reglas: { select: { regla_id: true, prioridad: true } },
        },
        orderBy: [{ activo: 'desc' }, { fecha_inicio: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.promociones.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  },

  async obtenerPorId(id: bigint) {
    return prisma.promociones.findUnique({
      where: { id },
      include: INCLUDE_REGLAS,
    });
  },

  async crear(input: CampanaConEscalasForm) {
    return prisma.$transaction(async (tx) => {
      const promocion = await tx.promociones.create({
        data: mapCampanaData(input),
      });
      await aplicarEscalas(tx, promocion.id, input, []);
      return tx.promociones.findUnique({
        where: { id: promocion.id },
        include: INCLUDE_REGLAS,
      });
    });
  },

  async actualizar(id: bigint, input: CampanaConEscalasForm) {
    return prisma.$transaction(async (tx) => {
      const previousIds = await obtenerReglaIdsCampana(tx, 'promocion', id);
      await tx.promociones.update({
        where: { id },
        data: mapCampanaData(input),
      });
      await aplicarEscalas(tx, id, input, previousIds);
      return tx.promociones.findUnique({
        where: { id },
        include: INCLUDE_REGLAS,
      });
    });
  },

  async desactivar(id: bigint) {
    return prisma.promociones.update({
      where: { id },
      data: { activo: false },
      include: INCLUDE_REGLAS,
    });
  },
};
