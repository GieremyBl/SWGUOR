import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import type { EtapaConfeccion, EstadoConfeccion } from '@prisma/client';

const SEGUIMIENTO_INCLUDE = {
  usuarios: { select: { id: true, email: true, rol: true } },
} as const;

/**
 * Función pura que gobierna la sincronización automática:
 * Mapea la etapa física del taller hacia el estado macro del sistema.
 */
function mapearEtapaAEstado(etapa: EtapaConfeccion): EstadoConfeccion {
  if (etapa === 'entregado_a_guor') return 'completada';
  return 'en_proceso'; // Cualquier fase intermedia mantiene el lote en producción activa
}

export const SeguimientoConfeccionService = {
  async obtenerPorConfeccion(confeccion_id: string) {
    const existe = await prisma.confecciones.findUnique({
      where: { id: BigInt(confeccion_id) },
      select: { id: true },
    });
    if (!existe) throw new Error('Confección no encontrada');

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

  /**
   * Registra el avance de etapa física, actualiza de forma síncrona
   * el estado de la confección y escribe el historial de auditoría.
   */
  async registrarCambioEstado(params: {
    confeccion_id: string;
    etapa_nueva: EtapaConfeccion;
    etapa_anterior: EtapaConfeccion | null;
    notas: string | null;
    responsable_id: string;
  }) {
    const idConfeccion = BigInt(params.confeccion_id);
    const idResponsable = BigInt(params.responsable_id);

    return await prisma.$transaction(async (tx) => {
      // 1. Verificar estado actual del lote para control de paradas
      const confeccionActual = await tx.confecciones.findUnique({
        where: { id: idConfeccion },
        select: { estado: true, fecha_inicio: true },
      });

      if (!confeccionActual) {
        throw new Error('La orden de confección solicitada no existe');
      }

      if (confeccionActual.estado === 'rechazada' || confeccionActual.estado === 'cancelada') {
        throw new Error(`Operación denegada: El lote se encuentra '${confeccionActual.estado}' y su flujo está congelado.`);
      }

      // 2. Determinar nuevo estado macro automático
      const nuevoEstadoCalculado = mapearEtapaAEstado(params.etapa_nueva);

      // 3. Actualizar la tabla maestra de confecciones
      await tx.confecciones.update({
        where: { id: idConfeccion },
        data: {
          estado: nuevoEstadoCalculado,
          etapa_actual: params.etapa_nueva, // Mantenemos guardada la última etapa física
          updated_at: new Date(),
          ...(params.etapa_nueva === 'recepcion_cortes' && !confeccionActual.fecha_inicio ? { fecha_inicio: new Date() } : {}),
          ...(params.etapa_nueva === 'entregado_a_guor' ? { fecha_fin: new Date() } : {}),
        },
      });

      // 4. Crear la fila en la bitácora de seguimiento
      // Nota: Tu columna en la base de datos se llama 'etapa_nuevo', lo mapeamos correctamente aquí
      const nuevoSeguimiento = await tx.seguimiento_confeccion.create({
        data: {
          confeccion_id: idConfeccion,
          etapa_anterior: params.etapa_anterior,
          etapa_nuevo: params.etapa_nueva,
          notas: params.notas ?? `Cambio de fase física registrado en taller.`,
          responsable_id: idResponsable,
        },
        include: SEGUIMIENTO_INCLUDE,
      });

      return serializeBigInt(nuevoSeguimiento);
    });
  },

  async actualizarNotas(id: string, notas: string | null) {
    const existe = await prisma.seguimiento_confeccion.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!existe) throw new Error('Registro de seguimiento no encontrado');

    const updated = await prisma.seguimiento_confeccion.update({
      where: { id: BigInt(id) },
      data: { notas },
      include: SEGUIMIENTO_INCLUDE,
    });
    return serializeBigInt(updated);
  },
};