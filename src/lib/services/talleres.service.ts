import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Prisma } from '@prisma/client';
import { EspecialidadTaller, EstadoTaller } from '@prisma/client';

export const TalleresService = {

  async listar() {
    const talleres = await prisma.talleres.findMany({
      include: { _count: { select: { confecciones: true } } },
      orderBy: { nombre: 'asc' },
    });
    return serializeBigInt(talleres);
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
    });
    return serializeBigInt(taller);
  },

  async actualizar(id: string, data: Partial<{
    nombre: string;
    contacto: string;
    telefono: string;
    email: string;
    direccion: string;
    especialidad: EspecialidadTaller;
    estado: EstadoTaller;
  }>) {
    const taller = await prisma.talleres.update({
      where: { id: BigInt(id) },
      data: {
        ...data,
        updated_at: new Date()
      } as Prisma.talleresUpdateInput,
    });
    return serializeBigInt(taller);
  },

  async desactivar(id: string) {
    const taller = await prisma.talleres.update({
      where: { id: BigInt(id) },
      data: { 
        estado: 'inactivo' 
      },
    });
    return serializeBigInt(taller);
  },
};