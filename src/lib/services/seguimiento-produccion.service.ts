import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Json } from '@/types/database';
import { Prisma } from '@prisma/client';
import z from 'zod';

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

export const registrarEtapaSchema = z.object({
  orden_id: z.union([z.string(), z.number()]),
  etapa: z.string(),
  observaciones: z.string().optional(),
  piezas_cortadas: z.number().nullable().optional(),
  merma_tela: z.number().nullable().optional(),
  piezas_aprobadas: z.number().nullable().optional(),
  piezas_segunda: z.number().nullable().optional(),
  piezas_rechazadas: z.number().nullable().optional(),
  variantes_color: z.string().optional(),
  tipo_decorado: z.string().optional(),
});

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
    etapa: string; // Puede venir el estado actual a avanzar, o el destino forzado
    observaciones?: string;
    usuario_id?: string;
    completado_en?: Date;
    duracion_minutos?: number;
    activo?: boolean;
    datos_etapa?: Json;
    esCambioForzado?: boolean; // Útil si tu frontend discrimina el modal manual
  }) {
    await asegurarOrdenExiste(data.orden_id);

    return prisma.$transaction(async (tx) => {
      const ahora = new Date();

      // 1. Buscamos el hito operativo que se encuentra activo actualmente
      const activo = await tx.seguimiento_produccion.findFirst({
        where: { orden_id: BigInt(data.orden_id), activo: true },
        orderBy: { created_at: 'desc' },
      });

      // 2. Cerramos el hito anterior calculando su duración en minutos reales
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

      // 3. SANITIZACIÓN INICIAL DE LA ENTRADA
      let entradaSanitizada = data.etapa
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // "Confección" -> "confeccion"

      // Mapeos de compatibilidad ortográfica para el ENUM de PostgreSQL
      if (entradaSanitizada === 'acabados') entradaSanitizada = 'acabado';
      if (entradaSanitizada === 'control de calidad') entradaSanitizada = 'control_calidad';
      if (entradaSanitizada === 'listo entrega' || entradaSanitizada === 'listo para entrega') entradaSanitizada = 'listo_entrega';
      if (entradaSanitizada === 'bordado' || entradaSanitizada === 'estampado' || entradaSanitizada === 'bordado / estampado') {
        entradaSanitizada = 'bordado_estampado';
      }

      let etapaDestino = entradaSanitizada;

      // ====================================================================
      // 4. DETERMINACIÓN DE LA ETAPA DESTINO (EVITANDO EFECTO CASCADA)
      // ====================================================================
      // Si NO es un cambio forzado manual, se calcula el paso secuencial continuo de la cadena textil:
      if (!data.esCambioForzado) {
        // Determinamos la etapa base de origen (si no viene en el body, usamos la que estaba activa en BD)
        const etapaOrigen = activo ? activo.etapa : entradaSanitizada;

        switch (etapaOrigen) {
          case 'diseno':
            etapaDestino = 'patronaje';
            break;
          case 'patronaje':
            etapaDestino = 'corte';
            break;
          case 'corte':
            etapaDestino = 'confeccion';
            break;
          case 'confeccion':
            etapaDestino = 'remallado';
            break;
          case 'remallado':
            etapaDestino = 'bordado_estampado';
            break;
          case 'bordado_estampado':
            etapaDestino = 'control_calidad';
            break;
          case 'control_calidad':
            etapaDestino = 'acabado';
            break;
          case 'acabado':
            etapaDestino = 'listo_entrega';
            break;
          default:
            etapaDestino = entradaSanitizada; // Preservar si ya está al final
            break;
        }
      }

      const nuevoEstado = etapaDestino === 'listo_entrega' ? 'completada' : 'en_produccion';

      // 5. Creamos el nuevo hito operativo con la etapa destino exacta y segura
      const seg = await tx.seguimiento_produccion.create({
        data: {
          orden_id: BigInt(data.orden_id),
          etapa: etapaDestino as Prisma.seguimiento_produccionCreateInput['etapa'],
          observaciones: data.observaciones || `Fase iniciada: ${etapaDestino}`,
          usuario_id: data.usuario_id && !isNaN(Number(data.usuario_id)) ? BigInt(data.usuario_id) : null,
          activo: true,
          iniciado_en: ahora,
          completado_en: null,
          duracion_minutos: 0,
          datos_etapa: data.datos_etapa !== undefined && data.datos_etapa !== null
            ? (data.datos_etapa as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
        },
        include: SEGUIMIENTO_INCLUDE,
      });

      // 6. Sincronizamos los cambios de la fase con la tabla maestra de órdenes de producción
      const updateMasterPayload: any = {
        etapa: etapaDestino as Prisma.ordenes_produccionUpdateInput['etapa'],
        estado: nuevoEstado,
        updated_at: ahora,
      };

      // Si se acaba de procesar la fase de corte, guardamos piezas y mermas en la orden general
      if (etapaDestino === 'confeccion' && data.datos_etapa) {
        const metadata = data.datos_etapa as Record<string, any>;
        if (metadata.piezas_cortadas !== undefined) updateMasterPayload.piezas_cortadas = Number(metadata.piezas_cortadas);
        if (metadata.merma_tela !== undefined) updateMasterPayload.merma_tela = Number(metadata.merma_tela);
      }

      await tx.ordenes_produccion.update({
        where: { id: BigInt(data.orden_id) },
        data: updateMasterPayload,
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