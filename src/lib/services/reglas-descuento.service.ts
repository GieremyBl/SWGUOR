import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { ESTADO_DESCUENTO_APLICACION } from '@/lib/constants/promociones';
import type { ReglaDescuentoForm } from '@/lib/schemas/promociones-ofertas';

export interface ReglasDescuentoFilters {
  activo?: boolean;
  busqueda?: string;
  categoria_id?: bigint;
  page?: number;
  limit?: number;
}

const INCLUDE_APLICACIONES = {
  descuento_aplicaciones: {
    where: { estado: { not: ESTADO_DESCUENTO_APLICACION.REVERTIDO } },
  },
} as const;

function toDate(value: string): Date {
  return new Date(value);
}

function mapReglaInput(input: ReglaDescuentoForm) {
  return {
    nombre: input.nombre.trim(),
    cantidad_min: input.cantidad_min,
    tipo_beneficio: input.tipo_beneficio as Prisma.reglas_descuentoCreateInput['tipo_beneficio'],
    valor_descuento: input.valor_descuento,
    fecha_inicio: toDate(input.fecha_inicio),
    fecha_fin: toDate(input.fecha_fin),
    tipo_conteo: (input.tipo_conteo ?? null) as Prisma.reglas_descuentoCreateInput['tipo_conteo'],
    activo: input.activo ?? true,
  };
}

export const reglasDescuentoService = {
  async listar(filters: ReglasDescuentoFilters = {}) {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.reglas_descuentoWhereInput = {};
    if (filters.activo !== undefined) where.activo = filters.activo;
    if (filters.categoria_id) {
      where.descuento_aplicaciones = {
        some: {
          aplicable_id: filters.categoria_id,
          descripcion: { startsWith: 'alcance:categoria' },
          estado: { not: ESTADO_DESCUENTO_APLICACION.REVERTIDO },
        },
      };
    }
    if (filters.busqueda) {
      where.nombre = { contains: filters.busqueda, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.reglas_descuento.findMany({
        where,
        include: INCLUDE_APLICACIONES,
        orderBy: [{ activo: 'desc' }, { fecha_inicio: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.reglas_descuento.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  },

  async listarActivas() {
    const now = new Date();
    return prisma.reglas_descuento.findMany({
      where: {
        activo: true,
        fecha_inicio: { lte: now },
        fecha_fin: { gte: now },
      },
      include: INCLUDE_APLICACIONES,
      orderBy: { nombre: 'asc' },
    });
  },

  async obtenerPorId(id: bigint) {
    return prisma.reglas_descuento.findUnique({
      where: { id },
      include: INCLUDE_APLICACIONES,
    });
  },

  async crear(input: ReglaDescuentoForm) {
    return prisma.reglas_descuento.create({
      data: mapReglaInput(input),
      include: INCLUDE_APLICACIONES,
    });
  },

  async actualizar(id: bigint, input: ReglaDescuentoForm) {
    return prisma.reglas_descuento.update({
      where: { id },
      data: mapReglaInput(input),
      include: INCLUDE_APLICACIONES,
    });
  },

  async desactivar(id: bigint) {
    return prisma.reglas_descuento.update({
      where: { id },
      data: { activo: false },
      include: INCLUDE_APLICACIONES,
    });
  },
};
