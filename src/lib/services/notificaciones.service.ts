import { prisma } from '@/lib/prisma';
import { notificaciones, Prisma } from '@prisma/client';

// Tipo de entrada para crear una notificación, derivado del tipo de Prisma
type CrearNotificacionData = Prisma.notificacionesUncheckedCreateInput;

// Filtros opcionales para consultar notificaciones de un usuario
interface FiltrosNotificacion {
  tipo?: notificaciones['tipo'];
  soloNoLeidas?: boolean;
  limite?: number;
}

export const notificacionesService = {
  crear: async (datos: CrearNotificacionData): Promise<notificaciones> => {
  return prisma.notificaciones.create({
    data: {
      usuario_id:      datos.usuario_id,
      tipo:            datos.tipo,
      titulo:          datos.titulo,
      mensaje:         datos.mensaje,
      referencia_tipo: datos.referencia_tipo,
      leido:           false,
    },
  });
},

  obtenerPorUsuario: async (
    usuarioId: number,
    filtros?: FiltrosNotificacion,
  ): Promise<notificaciones[]> => {
    return prisma.notificaciones.findMany({
      where: {
        usuario_id: usuarioId,
        ...(filtros?.tipo         && { tipo:  filtros.tipo }),
        ...(filtros?.soloNoLeidas && { leido: false }),
      },
      orderBy: { created_at: 'desc' },
      take: filtros?.limite ?? 50,
    });
  },

  marcarComoLeida: async (notificacionId: bigint): Promise<notificaciones> => {
    return prisma.notificaciones.update({
      where: { id: notificacionId },
      data:  { leido: true, leido_at: new Date() },
    });
  },

  marcarTodasComoLeidas: async (
    usuarioId: number,
  ): Promise<Prisma.BatchPayload> => {
    return prisma.notificaciones.updateMany({
      where: { usuario_id: usuarioId, leido: false },
      data:  { leido: true, leido_at: new Date() },
    });
  },

  obtenerNoLeidas: async (usuarioId: number): Promise<number> => {
    return prisma.notificaciones.count({
      where: { usuario_id: usuarioId, leido: false },
    });
  },

  limpiarAntiguas: async (
    diasRetener: number = 30,
  ): Promise<Prisma.BatchPayload> => {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasRetener);

    return prisma.notificaciones.deleteMany({
      where: {
        leido:      true,
        created_at: { lt: fechaLimite },
      },
    });
  },
};