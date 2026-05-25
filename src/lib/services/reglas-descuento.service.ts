import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { ReglaDescuentoForm } from '@/lib/schemas/promociones-ofertas';

export interface ReglasDescuentoFilters {
  activo?: boolean;
  busqueda?: string;
  categoria_id?: bigint;
  page?: number;
  limit?: number;
}

const INCLUDE_CATEGORIA = {
  categorias: { select: { id: true, nombre: true } },
} as const;

function toDate(value: string): Date {
  return new Date(value);
}

function mapReglaInput(input: ReglaDescuentoForm) {
  return {
    nombre: input.nombre.trim(),
    cantidad_min: input.cantidad_min,
    monto_min_compra: input.monto_min_compra ?? null,
    tipo_beneficio: input.tipo_beneficio as Prisma.reglas_descuentoCreateInput['tipo_beneficio'],
    valor_descuento: input.valor_descuento,
    fecha_inicio: toDate(input.fecha_inicio),
    fecha_fin: toDate(input.fecha_fin),
    categoria_id: input.categoria_id ? BigInt(input.categoria_id) : null,
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
    if (filters.categoria_id) where.categoria_id = filters.categoria_id;
    if (filters.busqueda) {
      const q = filters.busqueda;
      where.nombre = { contains: q, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.reglas_descuento.findMany({
        where,
        include: INCLUDE_CATEGORIA,
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
      include: INCLUDE_CATEGORIA,
      orderBy: { nombre: 'asc' },
    });
  },

  async obtenerPorId(id: bigint) {
    return prisma.reglas_descuento.findUnique({
      where: { id },
      include: INCLUDE_CATEGORIA,
    });
  },

  async crear(input: ReglaDescuentoForm) {
    return prisma.reglas_descuento.create({
      data: mapReglaInput(input),
      include: INCLUDE_CATEGORIA,
    });
  },

  async actualizar(id: bigint, input: ReglaDescuentoForm) {
    return prisma.reglas_descuento.update({
      where: { id },
      data: mapReglaInput(input),
      include: INCLUDE_CATEGORIA,
    });
  },

  async desactivar(id: bigint) {
    return prisma.reglas_descuento.update({
      where: { id },
      data: { activo: false },
      include: INCLUDE_CATEGORIA,
    });
  },
};
