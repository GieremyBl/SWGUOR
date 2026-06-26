import type { EstadoConfeccion, EtapaConfeccion } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

const TRANSICIONES_CONFECCION: Partial<
  Record<EstadoConfeccion, EstadoConfeccion[]>
> = {
  pendiente: ['en_proceso'],
  en_proceso: ['completada'],
};

export function puedeTransicionarConfeccion(
  desde: EstadoConfeccion | string | null,
  hacia: EstadoConfeccion | string,
): boolean {
  if (!desde) return false;
  return TRANSICIONES_CONFECCION[desde as EstadoConfeccion]?.includes(
    hacia as EstadoConfeccion,
  ) ?? false;
}

/**
 * Obtiene una orden mapeando de forma segura los BigInt a Strings para Next.js Client
 */
export async function obtenerOrdenRepresentante(ordenIdStr: string) {
  const ordenId = BigInt(ordenIdStr);
  
  const orden = await prisma.ordenes_produccion.findUnique({
    where: { id: ordenId },
    include: {
      productos: { select: { id: true, nombre: true, sku: true } },
      talleres: { select: { id: true, nombre: true, especialidad: true } },
      fichas_tecnicas: {
        select: {
          id: true,
          version: true,
          ficha_url: true,
          imagen_geometral: true,
          estado: true,
        },
      },
      pedidos: {
        include: {
          clientes: {
            select: {
              razon_social: true,
              nombre_comercial: true,
            },
          },
        },
      },
      confecciones: {
        include: {
          seguimiento_confeccion: {
            orderBy: { created_at: 'asc' },
          },
        },
      },
    },
  });

  if (!orden) return null;

  const talleresActivos = await prisma.talleres.findMany({
    where: { estado: 'activo' },
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      especialidad: true,
      contacto: true,
      telefono: true,
    },
  });

  // Retornamos los datos serializados previniendo errores de BigInt en componentes cliente
  return serializeBigInt({ orden, talleresActivos });
}

/**
 * Reasigna el taller externo encargado tanto en la orden como en la confección
 */
export async function reasignarTallerOrden(params: {
  ordenId: string | bigint;
  tallerId: string | bigint;
  usuarioId: string | bigint;
}) {
  const idOrden = BigInt(params.ordenId);
  const idTaller = BigInt(params.tallerId);
  const idUsuario = BigInt(params.usuarioId);

  const orden = await prisma.ordenes_produccion.findUnique({
    where: { id: idOrden },
    include: { confecciones: { take: 1 } },
  });

  if (!orden) {
    throw new Error('Orden de producción no encontrada');
  }

  const taller = await prisma.talleres.findFirst({
    where: { id: idTaller, estado: 'activo' },
  });

  if (!taller) {
    throw new Error('Taller no disponible o inactivo');
  }

  await prisma.$transaction(async (tx) => {
    await tx.ordenes_produccion.update({
      where: { id: idOrden },
      data: { taller_id: idTaller, updated_at: new Date() },
    });

    const conf = orden.confecciones[0];
    if (conf) {
      await tx.confecciones.update({
        where: { id: conf.id },
        data: { taller_id: idTaller, updated_at: new Date() },
      });

      // Se consulta el último seguimiento para heredar la etapa física real actual
      const ultimoSeguimiento = await tx.seguimiento_confeccion.findFirst({
        where: { confeccion_id: conf.id },
        orderBy: { created_at: 'desc' },
      });

      const etapaActual = (ultimoSeguimiento?.etapa_nueva || 'recepcion_cortes') as EtapaConfeccion;

      await tx.seguimiento_confeccion.create({
        data: {
          confeccion_id: conf.id,
          etapa_anterior: etapaActual,
          etapa_nueva: etapaActual, // Mantiene la misma etapa, solo documenta el cambio de locación
          notas: `Taller reasignado a ${taller.nombre}`,
          responsable_id: idUsuario,
        },
      });
    }
  });

  return taller.nombre;
}

/**
 * Avanza el estado maestro transaccionalmente evaluando las reglas del negocio
 */
export async function avanzarEstadoConfeccion(params: {
  ordenId: string | bigint;
  nuevoEstado: EstadoConfeccion;
  usuarioId: string | bigint;
  notas?: string;
}) {
  const idOrden = BigInt(params.ordenId);
  const idUsuario = BigInt(params.usuarioId);

  const orden = await prisma.ordenes_produccion.findUnique({
    where: { id: idOrden },
    include: { 
      confecciones: {
        include: {
          seguimiento_confeccion: {
            orderBy: { created_at: 'desc' },
            take: 1
          }
        }
      } 
    },
  });

  if (!orden || !orden.confecciones[0]) {
    throw new Error('No hay confección asociada a esta orden de producción');
  }

  const conf = orden.confecciones[0];

  if (!puedeTransicionarConfeccion(conf.estado, params.nuevoEstado)) {
    throw new Error(
      `Transición macro no permitida: ${conf.estado} → ${params.nuevoEstado}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.confecciones.update({
      where: { id: conf.id },
      data: {
        estado: params.nuevoEstado,
        etapa: params.nuevoEstado === 'completada' ? 'entregado_a_guor' : (conf.seguimiento_confeccion[0]?.etapa_nueva || conf.etapa || 'recepcion_cortes'),
        updated_at: new Date(),
        ...(params.nuevoEstado === 'completada' ? { fecha_fin: new Date() } : {}),
        ...(params.nuevoEstado === 'en_proceso' && !conf.fecha_inicio ? { fecha_inicio: new Date() } : {}),
      },
    });

    // Resolvemos las etapas basándonos en tu mapeo operativo
    const etapaPrevia = (conf.seguimiento_confeccion[0]?.etapa_nueva || 'recepcion_cortes') as EtapaConfeccion;
    const etapaSiguiente: EtapaConfeccion = params.nuevoEstado === 'completada' ? 'entregado_a_guor' : etapaPrevia;

    await tx.seguimiento_confeccion.create({
      data: {
        confeccion_id: conf.id,
        etapa_anterior: etapaPrevia,
        etapa_nueva: etapaSiguiente,
        notas: params.notas?.trim() || `Estado cambiado a ${params.nuevoEstado}`,
        responsable_id: idUsuario,
      },
    });

    if (params.nuevoEstado === 'completada') {
      await tx.ordenes_produccion.update({
        where: { id: idOrden },
        data: { estado: 'completada', updated_at: new Date() },
      });
    } else if (params.nuevoEstado === 'en_proceso') {
      await tx.ordenes_produccion.update({
        where: { id: idOrden },
        data: { estado: 'en_produccion', updated_at: new Date() },
      });
    }
  });
}