import type { EstadoConfeccion } from '@prisma/client';
import { prisma } from '@/lib/prisma';

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

export async function obtenerOrdenRepresentante(ordenId: bigint) {
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

  return { orden, talleresActivos };
}

export async function reasignarTallerOrden(params: {
  ordenId: bigint;
  tallerId: bigint;
  usuarioId: bigint;
}) {
  const orden = await prisma.ordenes_produccion.findUnique({
    where: { id: params.ordenId },
    include: { confecciones: { take: 1 } },
  });

  if (!orden) {
    throw new Error('Orden de producción no encontrada');
  }

  const taller = await prisma.talleres.findFirst({
    where: { id: params.tallerId, estado: 'activo' },
  });

  if (!taller) {
    throw new Error('Taller no disponible o inactivo');
  }

  await prisma.$transaction(async (tx) => {
    await tx.ordenes_produccion.update({
      where: { id: params.ordenId },
      data: { taller_id: params.tallerId, updated_at: new Date() },
    });

    const conf = orden.confecciones[0];
    if (conf) {
      await tx.confecciones.update({
        where: { id: conf.id },
        data: { taller_id: params.tallerId, updated_at: new Date() },
      });

      await tx.seguimiento_confeccion.create({
        data: {
          confeccion_id: conf.id,
          estado_anterior: conf.estado,
          estado_nuevo: conf.estado,
          notas: `Taller reasignado a ${taller.nombre}`,
          responsable_id: params.usuarioId,
        },
      });
    }
  });

  return taller.nombre;
}

export async function avanzarEstadoConfeccion(params: {
  ordenId: bigint;
  nuevoEstado: EstadoConfeccion;
  usuarioId: bigint;
  notas?: string;
}) {
  const orden = await prisma.ordenes_produccion.findUnique({
    where: { id: params.ordenId },
    include: { confecciones: { take: 1 } },
  });

  if (!orden?.confecciones[0]) {
    throw new Error('No hay confección asociada a esta orden');
  }

  const conf = orden.confecciones[0];

  if (!puedeTransicionarConfeccion(conf.estado, params.nuevoEstado)) {
    throw new Error(
      `Transición no permitida: ${conf.estado} → ${params.nuevoEstado}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.confecciones.update({
      where: { id: conf.id },
      data: {
        estado: params.nuevoEstado,
        updated_at: new Date(),
        ...(params.nuevoEstado === 'completada'
          ? { fecha_fin: new Date() }
          : {}),
        ...(params.nuevoEstado === 'en_proceso' && !conf.fecha_inicio
          ? { fecha_inicio: new Date() }
          : {}),
      },
    });

    await tx.seguimiento_confeccion.create({
      data: {
        confeccion_id: conf.id,
        estado_anterior: conf.estado,
        estado_nuevo: params.nuevoEstado,
        notas: params.notas?.trim() || null,
        responsable_id: params.usuarioId,
      },
    });

    if (params.nuevoEstado === 'completada') {
      await tx.ordenes_produccion.update({
        where: { id: params.ordenId },
        data: { estado: 'completada', updated_at: new Date() },
      });
    } else if (params.nuevoEstado === 'en_proceso') {
      await tx.ordenes_produccion.update({
        where: { id: params.ordenId },
        data: { estado: 'en_produccion', updated_at: new Date() },
      });
    }
  });
}
