import { prisma } from '@/lib/prisma';
import { Prisma, type almacenes } from '@prisma/client';

export interface CapacidadAlmacen {
  capacidadMaxima: number;
  capacidadUsada: number;
  disponible: number;
  porcentaje: number;
}

export const almacenesService = {
  
  crear: async (datos: Prisma.almacenesCreateInput): Promise<almacenes> => {
    if (!datos.nombre) {
      throw new Error('El nombre del almacén es obligatorio');
    }

    return await prisma.almacenes.create({
      data: {
        nombre: datos.nombre,
        estado: datos.estado ?? true,
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

  actualizar: async (id: string, datos: Prisma.almacenesUpdateInput): Promise<almacenes> => {
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

  obtenerCapacidad: async (id: string): Promise<CapacidadAlmacen | null> => {
    const almacen = await prisma.almacenes.findUnique({
      where: { id: BigInt(id) },
    });
    
    if (!almacen) return null;
    
    const capacidadTotal = almacen.capacidad_total ? Number(almacen.capacidad_total) : 0;
    
    return {
      capacidadMaxima: capacidadTotal,
      capacidadUsada: 0,
      disponible: capacidadTotal,
      porcentaje: 0,
    };
  },

  actualizarCapacidad: async (id: string): Promise<almacenes> => {
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