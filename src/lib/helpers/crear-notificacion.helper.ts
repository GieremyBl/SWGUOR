import type {
  EstadoPedido,
  ReferenciaNotificacion,
  TipoNotificacion,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CrearNotificacionParams {
  usuario_id: bigint;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  referencia_tipo: ReferenciaNotificacion;
  referencia_id?: bigint;
  url_destino?: string;
}

export async function crearNotificacion(params: CrearNotificacionParams) {
  return prisma.notificaciones.create({
    data: {
      usuario_id: params.usuario_id,
      tipo: params.tipo,
      titulo: params.titulo,
      mensaje: params.mensaje,
      referencia_tipo: params.referencia_tipo,
      referencia_id: params.referencia_id,
      url_destino: params.url_destino ?? null,
      leido: false,
    },
  });
}

async function resolverUsuarioIdCliente(clienteId: bigint): Promise<bigint | null> {
  const cliente = await prisma.clientes.findFirst({
    where: { id: clienteId },
    select: { usuario_id: true },
  });
  return cliente?.usuario_id ?? null;
}

export async function crearNotificacionCliente(params: {
  clienteId: bigint;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  referencia_tipo: ReferenciaNotificacion;
  referencia_id?: bigint;
  url_destino?: string;
}): Promise<void> {
  const usuarioId = await resolverUsuarioIdCliente(params.clienteId);
  if (!usuarioId) return;

  await crearNotificacion({
    usuario_id: usuarioId,
    tipo: params.tipo,
    titulo: params.titulo,
    mensaje: params.mensaje,
    referencia_tipo: params.referencia_tipo,
    referencia_id: params.referencia_id,
    url_destino: params.url_destino,
  });
}

const URL_SEGUIMIENTO = '/portal/seguimiento-pedido';

/** Notificaciones según transición de estado del pedido (cliente dueño). */
export async function notificarTransicionEstadoPedido(params: {
  clienteId: bigint;
  pedidoId: bigint;
  estadoAnterior: EstadoPedido | string | null;
  estadoNuevo: EstadoPedido | string;
}): Promise<void> {
  const { clienteId, pedidoId, estadoAnterior, estadoNuevo } = params;
  const id = String(pedidoId);
  const anterior = estadoAnterior ?? 'pendiente';

  if (
    (anterior === 'pendiente' || anterior === 'pagado') &&
    estadoNuevo === 'en_produccion'
  ) {
    await crearNotificacionCliente({
      clienteId,
      tipo: 'orden_produccion',
      titulo: 'Tu pedido está en producción',
      mensaje: `Hemos comenzado a trabajar en tu pedido #${id}`,
      referencia_tipo: 'PEDIDO',
      referencia_id: pedidoId,
      url_destino: URL_SEGUIMIENTO,
    });
    return;
  }

  if (anterior === 'en_produccion' && estadoNuevo === 'listo_para_despacho') {
    await crearNotificacionCliente({
      clienteId,
      tipo: 'pedido_vencido',
      titulo: '¡Tu pedido está listo!',
      mensaje: `Tu pedido #${id} está listo. Por favor confirma tu dirección de entrega.`,
      referencia_tipo: 'PEDIDO',
      referencia_id: pedidoId,
      url_destino: URL_SEGUIMIENTO,
    });
    return;
  }

  if (anterior === 'listo_para_despacho' && estadoNuevo === 'entregado') {
    await crearNotificacionCliente({
      clienteId,
      tipo: 'sistema',
      titulo: 'Pedido entregado',
      mensaje: `Tu pedido #${id} ha sido entregado. ¡Gracias por tu compra!`,
      referencia_tipo: 'PEDIDO',
      referencia_id: pedidoId,
      url_destino: URL_SEGUIMIENTO,
    });
  }
}
