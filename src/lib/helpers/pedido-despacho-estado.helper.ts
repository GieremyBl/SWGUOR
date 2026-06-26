import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolverEstadoVisualPedido } from '@/lib/helpers/pedido-estado-visual.helper';

type Tx = Prisma.TransactionClient;

export async function obtenerDespachoActivoPedido(pedidoId: bigint) {
  return prisma.despachos.findFirst({
    where: { pedido_id: pedidoId },
    orderBy: { created_at: 'desc' },
    select: { id: true, estado: true, fecha_entrega: true },
  });
}

export function enriquecerConEstadoDespacho(
  pedidoEstado: string | null | undefined,
  despachoEstado?: string | null,
) {
  const visual = resolverEstadoVisualPedido(pedidoEstado, despachoEstado);
  return {
    despacho_estado: despachoEstado ?? null,
    estado_visual: visual.key,
    estado_label: visual.label,
  };
}

/** Registra hito en seguimiento sin cambiar el enum de pedidos (p. ej. en camino). */
export async function registrarSeguimientoLogisticaPedido(
  tx: Tx,
  params: {
    pedidoId: bigint;
    notas: string;
    creadoPor?: string | null;
  },
): Promise<void> {
  const pedido = await tx.pedidos.findUnique({
    where: { id: params.pedidoId },
    select: { estado: true },
  });

  if (!pedido?.estado || pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
    return;
  }

  await tx.seguimiento_pedido.create({
    data: {
      pedido_id: params.pedidoId,
      status: pedido.estado,
      notas: params.notas,
      creado_por: params.creadoPor ?? null,
    },
  });
}
