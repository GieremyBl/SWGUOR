import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import type { EtapaConfeccion, EstadoConfeccion } from '@prisma/client';

const SEGUIMIENTO_INCLUDE = {
  usuarios: { select: { id: true, email: true, rol: true } },
} as const;

function etapaToEstado(etapa: EtapaConfeccion): EstadoConfeccion {
  if (etapa === 'entregado_a_guor') return 'completada';
  return 'en_proceso';
}

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
    etapa_nueva:    EtapaConfeccion;
    etapa_anterior?: EtapaConfeccion | null;
    notas?:         string | null;
    responsable_id?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Leer dentro de la transacción para evitar race conditions
      const conf = await tx.confecciones.findUnique({
        where: { id: BigInt(data.confeccion_id) },
        select: { estado: true },
      });
      if (!conf) throw new Error('Confección no encontrada');

      const etapaAnterior = data.etapa_anterior ?? (conf.estado as EtapaConfeccion);

      // confecciones.estado es EstadoConfeccion — se mapea desde EtapaConfeccion
      await tx.confecciones.update({
        where: { id: BigInt(data.confeccion_id) },
        data: {
          estado: etapaToEstado(data.etapa_nueva),
          ...(data.etapa_nueva === 'recepcion_cortes'  && { fecha_inicio: new Date() }),
          ...(data.etapa_nueva === 'entregado_a_guor'  && { fecha_fin:    new Date() }),
          updated_at: new Date(),
        },
      });

      const seg = await tx.seguimiento_confeccion.create({
        data: {
          confeccion_id:  BigInt(data.confeccion_id),
          etapa_anterior: etapaAnterior,
          etapa_nuevo:    data.etapa_nueva,
          notas:          data.notas ?? null,
          responsable_id: data.responsable_id ? BigInt(data.responsable_id) : null,
        },
        include: SEGUIMIENTO_INCLUDE,
      });

      return serializeBigInt(seg);
    });
  },
};