import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Prisma } from '@prisma/client';
import type { EspecialidadTaller, EstadoTaller } from '@prisma/client';

const TALLER_INCLUDE = {
  _count: { select: { confecciones: true, ordenes_produccion: true } },
} as const;

export const TalleresService = {

  async listar(params?: {
    search?: string;
    estado?: string;
  }) {
    const where: Prisma.talleresWhereInput = {};

    if (params?.estado && params.estado !== 'todos') {
      where.estado = params.estado as EstadoTaller;
    }

    if (params?.search) {
      where.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { ruc: { contains: params.search } },
        { contacto: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const talleres = await prisma.talleres.findMany({
      where,
      include: TALLER_INCLUDE,
      orderBy: { nombre: 'asc' },
    });
    return serializeBigInt(talleres);
  },

  async obtenerPorId(id: string) {
    const taller = await prisma.talleres.findUnique({
      where: { id: BigInt(id) },
      include: TALLER_INCLUDE,
    });
    return taller ? serializeBigInt(taller) : null;
  },

  async crear(data: {
    nombre: string;
    ruc: string;
    contacto: string;
    telefono: string;
    email?: string;
    direccion: string;
    especialidad?: EspecialidadTaller;
    estado?: EstadoTaller;
  }) {
    const taller = await prisma.talleres.create({
      data: {
        nombre: data.nombre,
        ruc: data.ruc,
        contacto: data.contacto,
        telefono: data.telefono,
        email: data.email ?? null,
        direccion: data.direccion,
        especialidad: data.especialidad ?? null,
        estado: data.estado ?? 'activo',
      },
      include: TALLER_INCLUDE,
    });
    return serializeBigInt(taller);
  },

  async actualizar(id: string, data: Partial<{
    nombre: string;
    contacto: string;
    telefono: string;
    email: string | null;
    direccion: string;
    especialidad: EspecialidadTaller | null;
    estado: EstadoTaller;
  }>) {
    const taller = await prisma.talleres.update({
      where: { id: BigInt(id) },
      data: {
        ...data,
        updated_at: new Date(),
      } as Prisma.talleresUpdateInput,
      include: TALLER_INCLUDE,
    });
    return serializeBigInt(taller);
  },

  async desactivar(id: string) {
    const taller = await prisma.talleres.update({
      where: { id: BigInt(id) },
      data: {
        estado: 'inactivo',
        updated_at: new Date(),
      },
      include: TALLER_INCLUDE,
    });
    return serializeBigInt(taller);
  },

  async suspender(id: string) {
    const taller = await prisma.talleres.update({
      where: { id: BigInt(id) },
      data: {
        estado: 'suspendido',
        updated_at: new Date(),
      },
      include: TALLER_INCLUDE,
    });
    return serializeBigInt(taller);
  },
};
