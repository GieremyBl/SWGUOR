import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Prisma } from '@prisma/client';
import type { EspecialidadTaller } from '@prisma/client';

const TARIFA_INCLUDE = {
  talleres: { select: { id: true, nombre: true } },
} as const;

export interface TarifaTallerInput {
  taller_id: string | number;
  especialidad: EspecialidadTaller | string;
  precio_unitario: number | string;
  moneda?: string;
  vigente_desde?: string;
  vigente_hasta?: string | null;
  activo?: boolean;
  notas?: string | null;
}

async function asegurarTallerExiste(taller_id: string | number) {
  const taller = await prisma.talleres.findUnique({
    where: { id: BigInt(taller_id) },
    select: { id: true },
  });
  if (!taller) throw new Error('Taller no encontrado');
}

function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new Error('Ya existe una tarifa para esta especialidad y fecha de vigencia');
    }
    if (error.code === 'P2025') {
      throw new Error('Tarifa no encontrada');
    }
  }
  throw error;
}

export const TarifasTallerService = {

  async listar(params?: {
    taller_id?: string;
    especialidad?: string;
    activo?: boolean | 'all';
  }) {
    const where: Prisma.tarifas_tallerWhereInput = {};

    if (params?.taller_id) where.taller_id = BigInt(params.taller_id);
    if (params?.especialidad) {
      where.especialidad = params.especialidad as EspecialidadTaller;
    }
    if (params?.activo !== undefined && params.activo !== 'all') {
      where.activo = params.activo;
    }

    const tarifas = await prisma.tarifas_taller.findMany({
      where,
      include: TARIFA_INCLUDE,
      orderBy: [{ vigente_desde: 'desc' }, { id: 'desc' }],
    });

    return serializeBigInt(tarifas);
  },

  async obtenerPorId(id: string) {
    const tarifa = await prisma.tarifas_taller.findUnique({
      where: { id: BigInt(id) },
      include: TARIFA_INCLUDE,
    });
    return tarifa ? serializeBigInt(tarifa) : null;
  },

  async crear(data: TarifaTallerInput) {
    await asegurarTallerExiste(data.taller_id);

    try {
      const created = await prisma.tarifas_taller.create({
        data: {
          taller_id: BigInt(data.taller_id),
          especialidad: data.especialidad as EspecialidadTaller,
          precio_unitario: data.precio_unitario,
          moneda: data.moneda ?? 'PEN',
          vigente_desde: data.vigente_desde ? new Date(data.vigente_desde) : new Date(),
          vigente_hasta: data.vigente_hasta ? new Date(data.vigente_hasta) : null,
          activo: data.activo ?? true,
          notas: data.notas ?? null,
        },
        include: TARIFA_INCLUDE,
      });
      return serializeBigInt(created);
    } catch (error) {
      mapPrismaError(error);
    }
  },

  async actualizar(id: string, data: Partial<Omit<TarifaTallerInput, 'taller_id'>>) {
    try {
      const updated = await prisma.tarifas_taller.update({
        where: { id: BigInt(id) },
        data: {
          ...(data.especialidad !== undefined && {
            especialidad: data.especialidad as EspecialidadTaller,
          }),
          ...(data.precio_unitario !== undefined && { precio_unitario: data.precio_unitario }),
          ...(data.moneda !== undefined && { moneda: data.moneda }),
          ...(data.vigente_desde !== undefined && {
            vigente_desde: new Date(data.vigente_desde),
          }),
          ...(data.vigente_hasta !== undefined && {
            vigente_hasta: data.vigente_hasta ? new Date(data.vigente_hasta) : null,
          }),
          ...(data.activo !== undefined && { activo: data.activo }),
          ...(data.notas !== undefined && { notas: data.notas }),
          updated_at: new Date(),
        },
        include: TARIFA_INCLUDE,
      });
      return serializeBigInt(updated);
    } catch (error) {
      mapPrismaError(error);
    }
  },

  async desactivar(id: string) {
    try {
      const updated = await prisma.tarifas_taller.update({
        where: { id: BigInt(id) },
        data: { activo: false, updated_at: new Date() },
        include: TARIFA_INCLUDE,
      });
      return serializeBigInt(updated);
    } catch (error) {
      mapPrismaError(error);
    }
  },

  async calcularCosto(id: string, cantidad: number) {
    const tarifa = await this.obtenerPorId(id);
    if (!tarifa) throw new Error('Tarifa no encontrada');
    if (!tarifa.activo) throw new Error('La tarifa no está activa');

    const precio = Number(tarifa.precio_unitario);
    const costo = Math.round(precio * cantidad * 100) / 100;

    return {
      tarifa,
      precio_unitario: precio,
      cantidad,
      costo,
      moneda: tarifa.moneda,
    };
  },
};

/** @deprecated Use TarifasTallerService */
export const tarifaTalleresService = TarifasTallerService;
