import type { EstadoPedido } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { crearNotificacionCliente } from '@/lib/helpers/crear-notificacion.helper';

/** Días hábiles estimados según etapa (referencia para el cliente). */
const DIAS_ETA_POR_ESTADO: Record<string, number> = {
  pendiente: 14,
  en_produccion: 10,
  listo_para_despacho: 3,
  pagado: 12,
  entregado: 0,
  cancelado: 0,
};

export function calcularFechaEntregaEstimada(
  createdAt: Date | string,
  estado: EstadoPedido | string | null,
): Date {
  const base = new Date(createdAt);
  const key = estado ?? 'pendiente';
  const dias = DIAS_ETA_POR_ESTADO[key] ?? 14;
  if (key === 'entregado' || key === 'cancelado') {
    return base;
  }
  const eta = new Date(base);
  eta.setDate(eta.getDate() + dias);
  return eta;
}

export function formatearEtaLegible(eta: Date): string {
  return eta.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function registrarSeguimientoInicial(
  pedidoId: bigint,
  notas?: string,
): Promise<void> {
  const existe = await prisma.seguimiento_pedido.findFirst({
    where: { pedido_id: pedidoId },
    select: { id: true },
  });
  if (existe) return;

  await prisma.seguimiento_pedido.create({
    data: {
      pedido_id: pedidoId,
      status: 'pendiente',
      notas:
        notas ??
        'Pedido confirmado. El equipo comercial dará seguimiento a su producción.',
    },
  });
}

export async function notificarClienteSobrePedido(params: {
  clienteId: bigint;
  pedidoId: bigint;
  titulo: string;
  mensaje: string;
}): Promise<void> {
  await crearNotificacionCliente({
    clienteId: params.clienteId,
    tipo: 'sistema',
    titulo: params.titulo,
    mensaje: params.mensaje,
    referencia_tipo: 'PEDIDO',
    referencia_id: params.pedidoId,
    url_destino: '/portal/seguimiento-pedido',
  });
}

export { crearNotificacion, crearNotificacionCliente, notificarTransicionEstadoPedido } from '@/lib/helpers/crear-notificacion.helper';
