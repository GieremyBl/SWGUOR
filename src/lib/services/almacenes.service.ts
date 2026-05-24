import { prisma } from '@/lib/prisma';
import type { almacenes } from '@prisma/client';

export const almacenesService = {
  crear: async (datos: Partial<almacenes>): Promise<almacenes> => {
    if (!datos.nombre) throw new Error('El nombre del almacén es obligatorio');

    return await prisma.almacenes.create({
      data: {
        nombre: datos.nombre,
        estado: true,
        descripcion: datos.descripcion,
        direccion: datos.direccion,
        telefono: datos.telefono,
        email: datos.email,
        capacidad_total: datos.capacidad_total,
        unidad_capacidad: datos.unidad_capacidad || 'unidades',
      },
    });
  },

  obtenerTodos: async (): Promise<almacenes[]> => {
    return await prisma.almacenes.findMany({
      where: { estado: true },
      orderBy: { nombre: 'asc' },
    });
  },

  obtenerPorId: async (id: string): Promise<almacenes | null> => {
    return await prisma.almacenes.findUnique({
      where: { id: BigInt(id) },
    });
  },

  actualizar: async (id: string, datos: Partial<almacenes>): Promise<almacenes> => {
    return await prisma.almacenes.update({
      where: { id: BigInt(id) },
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        direccion: datos.direccion,
        telefono: datos.telefono,
        email: datos.email,
        capacidad_total: datos.capacidad_total,
      },
    });
  },

  obtenerCapacidad: async (id: string) => {
    const almacen = await prisma.almacenes.findUnique({
      where: { id: BigInt(id) },
    });
    if (!almacen) return null;
    return {
      capacidadMaxima: almacen.capacidad_total ? Number(almacen.capacidad_total) : 0,
      capacidadUsada: 0,
      disponible: almacen.capacidad_total ? Number(almacen.capacidad_total) : 0,
      porcentaje: 0,
    };
  },

  actualizarCapacidad: async (id: string, _nuevoUso: number): Promise<almacenes> => {
    return await prisma.almacenes.findUniqueOrThrow({
      where: { id: BigInt(id) },
    });
  },

  obtenerAlmacenesCriticos: async (): Promise<almacenes[]> => {
    return await prisma.almacenes.findMany({
      where: { estado: true },
    });
  },
};