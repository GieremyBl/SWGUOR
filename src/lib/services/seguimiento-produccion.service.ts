import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Prisma } from '@prisma/client';

const SEGUIMIENTO_INCLUDE = {
  usuarios: {
    select: { id: true, email: true, rol: true },
  },
} as const;

function calcularDuracionMinutos(iniciado: Date, completado: Date): number {
  return Math.max(0, Math.round((completado.getTime() - iniciado.getTime()) / 60000));
}

async function asegurarOrdenExiste(orden_id: string) {
  const orden = await prisma.ordenes_produccion.findUnique({
    where: { id: BigInt(orden_id) },
    select: { id: true },
  });
  if (!orden) throw new Error('Orden de producción no encontrada');
}

export const SeguimientoProduccionService = {

  async obtenerPorOrden(orden_id: string) {
    await asegurarOrdenExiste(orden_id);

    const seguimientos = await prisma.seguimiento_produccion.findMany({
      where: { orden_id: BigInt(orden_id) },
      include: SEGUIMIENTO_INCLUDE,
      orderBy: { created_at: 'desc' },
    });

    return serializeBigInt(seguimientos);
  },

  async obtenerPorId(id: string) {
    const seg = await prisma.seguimiento_produccion.findUnique({
      where: { id: BigInt(id) },
      include: SEGUIMIENTO_INCLUDE,
    });
    return seg ? serializeBigInt(seg) : null;
  },

  async crearInicial(orden_id: bigint, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.seguimiento_produccion.create({
      data: {
        orden_id,
        etapa: 'diseno',
        observaciones: 'Orden creada — pendiente de inicio',
        activo: true,
      },
    });
  },

  async registrarEtapa(data: {
    orden_id: string;
    etapa: string;
    observaciones?: string;
    usuario_id?: string;
  }) {
    await asegurarOrdenExiste(data.orden_id);

    return prisma.$transaction(async (tx) => {
      const ahora = new Date();
      const activo = await tx.seguimiento_produccion.findFirst({
        where: { orden_id: BigInt(data.orden_id), activo: true },
        orderBy: { created_at: 'desc' },
      });

      if (activo) {
        await tx.seguimiento_produccion.update({
          where: { id: activo.id },
          data: {
            activo: false,
            completado_en: ahora,
            duracion_minutos: calcularDuracionMinutos(activo.iniciado_en, ahora),
          },
        });
      }

      const seg = await tx.seguimiento_produccion.create({
        data: {
          orden_id: BigInt(data.orden_id),
          etapa: data.etapa as Prisma.seguimiento_produccionCreateInput['etapa'],
          observaciones: data.observaciones ?? null,
          usuario_id: data.usuario_id ? BigInt(data.usuario_id) : null,
          activo: true,
        },
        include: SEGUIMIENTO_INCLUDE,
      });

      const etapa = data.etapa as Prisma.ordenes_produccionUpdateInput['etapa'];
      const nuevoEstado = data.etapa === 'listo_entrega' ? 'completada' : 'en_produccion';

      await tx.ordenes_produccion.update({
        where: { id: BigInt(data.orden_id) },
        data: {
          etapa,
          estado: nuevoEstado,
          updated_at: ahora,
        },
      });

      return serializeBigInt(seg);
    });
  },

  async actualizarObservaciones(id: string, observaciones: string | null) {
    const existente = await prisma.seguimiento_produccion.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!existente) throw new Error('Registro de seguimiento no encontrado');

    const updated = await prisma.seguimiento_produccion.update({
      where: { id: BigInt(id) },
      data: { observaciones },
      include: SEGUIMIENTO_INCLUDE,
    });

    return serializeBigInt(updated);
  },
};
