import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Prisma } from '@prisma/client';
import type { EstadoConfeccion } from '@prisma/client';

const SEGUIMIENTO_INCLUDE = {
  usuarios: { select: { id: true, email: true, rol: true } },
} as const;

async function asegurarConfeccionExiste(confeccion_id: string) {
  const conf = await prisma.confecciones.findUnique({
    where: { id: BigInt(confeccion_id) },
    select: { id: true, estado: true },
  });
  if (!conf) throw new Error('Confección no encontrada');
  return conf;
}

export const SeguimientoConfeccionService = {

  async obtenerPorConfeccion(confeccion_id: string) {
    await asegurarConfeccionExiste(confeccion_id);

    const seguimientos = await prisma.seguimiento_confeccion.findMany({
      where: { confeccion_id: BigInt(confeccion_id) },
      include: SEGUIMIENTO_INCLUDE,
      orderBy: { created_at: 'desc' },
    });

    return serializeBigInt(seguimientos);
  },

  async obtenerPorId(id: string) {
    const seg = await prisma.seguimiento_confeccion.findUnique({
      where: { id: BigInt(id) },
      include: SEGUIMIENTO_INCLUDE,
    });
    return seg ? serializeBigInt(seg) : null;
  },

  async registrarCambioEstado(data: {
    confeccion_id: string;
    estado_nuevo: string;
    estado_anterior?: string | null;
    notas?: string | null;
    responsable_id?: string;
  }) {
    const conf = await asegurarConfeccionExiste(data.confeccion_id);
    const estadoAnterior = (data.estado_anterior ?? conf.estado) as EstadoConfeccion | null;
    const estadoNuevo = data.estado_nuevo as EstadoConfeccion;

    return prisma.$transaction(async (tx) => {
      const fechaInicio = estadoNuevo === 'en_proceso' ? new Date() : undefined;
      const fechaFin = estadoNuevo === 'completada' ? new Date() : undefined;

      await tx.confecciones.update({
        where: { id: BigInt(data.confeccion_id) },
        data: {
          estado: estadoNuevo,
          ...(fechaInicio && { fecha_inicio: fechaInicio }),
          ...(fechaFin && { fecha_fin: fechaFin }),
          updated_at: new Date(),
        },
      });

      const seg = await tx.seguimiento_confeccion.create({
        data: {
          confeccion_id: BigInt(data.confeccion_id),
          estado_anterior: estadoAnterior,
          estado_nuevo: estadoNuevo,
          notas: data.notas ?? null,
          responsable_id: data.responsable_id ? BigInt(data.responsable_id) : null,
        },
        include: SEGUIMIENTO_INCLUDE,
      });

      return serializeBigInt(seg);
    });
  },

  async actualizarNotas(id: string, notas: string | null) {
    const existente = await prisma.seguimiento_confeccion.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!existente) throw new Error('Registro de seguimiento no encontrado');

    const updated = await prisma.seguimiento_confeccion.update({
      where: { id: BigInt(id) },
      data: { notas },
      include: SEGUIMIENTO_INCLUDE,
    });

    return serializeBigInt(updated);
  },
};
