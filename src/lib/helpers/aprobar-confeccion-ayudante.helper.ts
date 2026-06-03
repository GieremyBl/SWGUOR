import { prisma } from '@/lib/prisma';
import type { EstadoConfeccion, EstadoOrdenProduccion } from '@prisma/client';
import { precargarDireccionDespachoPedido } from '@/lib/helpers/pedido-direccion.helper';
import { validarTransicionEstadoPedido } from '@/lib/helpers/pedido-transiciones.helper';

const ESTADO_CONFECCION_COMPLETADA = 'completada' satisfies EstadoConfeccion;
const ESTADO_ORDEN_COMPLETADA = 'completada' satisfies EstadoOrdenProduccion;

const NOTA_APROBACION = 'Conformidad del taller aprobada por ayudante';

export interface ResultadoAprobarConfeccion {
  confeccionId: bigint;
  pedidoId: bigint;
  yaCompletada: boolean;
}

export async function aprobarConfeccionAyudante(
  confeccionId: bigint,
): Promise<ResultadoAprobarConfeccion> {
  const conf = await prisma.confecciones.findUnique({
    where: { id: confeccionId },
    include: {
      ordenes_produccion: {
        include: {
          pedidos: { select: { id: true, estado: true, cliente_id: true } },
        },
      },
    },
  });

  if (!conf) {
    throw new Error('Confección no encontrada');
  }

  const pedido = conf.ordenes_produccion?.pedidos;
  if (!pedido) {
    throw new Error('La confección no está vinculada a un pedido');
  }

  if (
    conf.estado === ESTADO_CONFECCION_COMPLETADA &&
    pedido.estado === 'listo_para_despacho'
  ) {
    return {
      confeccionId,
      pedidoId: pedido.id,
      yaCompletada: true,
    };
  }

  if (conf.estado === ESTADO_CONFECCION_COMPLETADA) {
    return {
      confeccionId,
      pedidoId: pedido.id,
      yaCompletada: true,
    };
  }

  validarTransicionEstadoPedido(pedido.estado, 'listo_para_despacho');

  const ordenId = conf.orden_produccion_id;
  if (!ordenId) {
    throw new Error('La confección no tiene orden de producción asociada');
  }

  await prisma.$transaction(async (tx) => {
    await tx.confecciones.update({
      where: { id: confeccionId },
      data: {
        estado: ESTADO_CONFECCION_COMPLETADA,
        fecha_fin: new Date(),
        updated_at: new Date(),
      },
    });

    await tx.ordenes_produccion.update({
      where: { id: ordenId },
      data: { estado: ESTADO_ORDEN_COMPLETADA, updated_at: new Date() },
    });

    await tx.pedidos.update({
      where: { id: pedido.id },
      data: { estado: 'listo_para_despacho', updated_at: new Date() },
    });

    if (pedido.cliente_id) {
      await precargarDireccionDespachoPedido(tx, pedido.id, pedido.cliente_id);
    }

    await tx.seguimiento_pedido.create({
      data: {
        pedido_id: pedido.id,
        status: 'listo_para_despacho',
        notas: NOTA_APROBACION,
      },
    });
  });

  return {
    confeccionId,
    pedidoId: pedido.id,
    yaCompletada: false,
  };
}

export async function asignarTallerConfeccionAyudante(params: {
  confeccionId: bigint;
  tallerId: bigint;
}): Promise<{ tallerNombre: string }> {
  const conf = await prisma.confecciones.findUnique({
    where: { id: params.confeccionId },
    select: { id: true, estado: true, orden_produccion_id: true },
  });

  if (!conf) {
    throw new Error('Confección no encontrada');
  }

  if (conf.estado === ESTADO_CONFECCION_COMPLETADA) {
    throw new Error('No se puede reasignar taller en una confección completada');
  }

  const taller = await prisma.talleres.findFirst({
    where: { id: params.tallerId, estado: 'activo' },
    select: { id: true, nombre: true },
  });

  if (!taller) {
    throw new Error('Taller no disponible o inactivo');
  }

  await prisma.$transaction(async (tx) => {
    await tx.confecciones.update({
      where: { id: params.confeccionId },
      data: { taller_id: params.tallerId, updated_at: new Date() },
    });

    if (conf.orden_produccion_id) {
      await tx.ordenes_produccion.update({
        where: { id: conf.orden_produccion_id },
        data: { taller_id: params.tallerId, updated_at: new Date() },
      });
    }
  });

  return { tallerNombre: taller.nombre };
}
