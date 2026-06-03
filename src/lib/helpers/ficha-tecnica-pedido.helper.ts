import { prisma } from '@/lib/prisma';
import {
  crearNotificacion,
  notificarTransicionEstadoPedido,
} from '@/lib/helpers/crear-notificacion.helper';
import { puedeTransicionar } from '@/lib/helpers/pedido-transiciones.helper';
import { registrarDisenoFichaAprobada } from '@/lib/helpers/ficha-tecnica-aprobacion.helper';

export interface ProgresoFichasPedido {
  total: number;
  aprobadas: number;
  todasAprobadas: boolean;
}

export async function obtenerProductosUnicosDelPedido(
  pedidoId: bigint,
): Promise<bigint[]> {
  const items = await prisma.pedido_items.findMany({
    where: { pedido_id: pedidoId },
    select: {
      producto_id: true,
      productos: { select: { id: true } },
    },
  });

  const ids = new Set<string>();
  for (const item of items) {
    const pid = item.productos?.id ?? item.producto_id;
    if (pid) ids.add(String(pid));
  }

  return [...ids].map((id) => BigInt(id));
}

export async function obtenerProgresoFichasPedido(
  pedidoId: bigint,
): Promise<ProgresoFichasPedido> {
  const productoIds = await obtenerProductosUnicosDelPedido(pedidoId);

  if (productoIds.length === 0) {
    return { total: 0, aprobadas: 0, todasAprobadas: false };
  }

  let aprobadas = 0;

  for (const productoId of productoIds) {
    const fichaAprobada = await prisma.fichas_tecnicas.findFirst({
      where: { id_producto: productoId, estado: 'aprobada' },
      orderBy: { created_at: 'desc' },
      select: { id: true },
    });
    if (fichaAprobada) aprobadas += 1;
  }

  return {
    total: productoIds.length,
    aprobadas,
    todasAprobadas: aprobadas === productoIds.length,
  };
}

export function pedidoFichasEnModoSoloLectura(estadoPedido: string | null): boolean {
  const e = estadoPedido ?? 'pendiente';
  return ['en_produccion', 'listo_para_despacho', 'entregado'].includes(e);
}

async function notificarCortadoresPedidoListo(pedidoId: bigint): Promise<void> {
  const cortadores = await prisma.usuarios.findMany({
    where: { rol: 'cortador', estado: 'activo' },
    select: { id: true },
  });

  const pedidoRef = String(pedidoId);
  const urlDestino = `/cortador/pedidos/${pedidoRef}`;

  await Promise.all(
    cortadores.map((cortador) =>
      crearNotificacion({
        usuario_id: cortador.id,
        tipo: 'orden_produccion',
        titulo: 'Pedido listo para corte',
        mensaje: `Todas las fichas del pedido #${pedidoRef} fueron aprobadas. Puede iniciar el corte.`,
        referencia_tipo: 'PEDIDO',
        referencia_id: pedidoId,
        url_destino: urlDestino,
      }),
    ),
  );
}

export async function transicionarPedidoEnProduccionSiFichasCompletas(params: {
  pedidoId: bigint;
}): Promise<{ transicionado: boolean; motivo?: string }> {
  const progreso = await obtenerProgresoFichasPedido(params.pedidoId);

  if (progreso.total === 0) {
    return { transicionado: false, motivo: 'El pedido no tiene productos' };
  }

  if (!progreso.todasAprobadas) {
    return { transicionado: false, motivo: 'Faltan fichas por aprobar' };
  }

  const pedido = await prisma.pedidos.findUnique({
    where: { id: params.pedidoId },
    select: { estado: true, cliente_id: true },
  });

  if (!pedido?.cliente_id) {
    return { transicionado: false, motivo: 'Pedido no encontrado' };
  }

  const estadoActual = pedido.estado ?? 'pendiente';

  if (estadoActual === 'en_produccion') {
    return { transicionado: false, motivo: 'El pedido ya está en producción' };
  }

  if (!puedeTransicionar(estadoActual, 'en_produccion')) {
    return {
      transicionado: false,
      motivo: `No se puede pasar a producción desde estado ${estadoActual}`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pedidos.update({
      where: { id: params.pedidoId },
      data: { estado: 'en_produccion', updated_at: new Date() },
    });

    await tx.seguimiento_pedido.create({
      data: {
        pedido_id: params.pedidoId,
        status: 'en_produccion',
        notas:
          'Todas las fichas técnicas del pedido fueron aprobadas. Inicio de producción.',
      },
    });
  });

  await notificarTransicionEstadoPedido({
    clienteId: pedido.cliente_id,
    pedidoId: params.pedidoId,
    estadoAnterior: estadoActual,
    estadoNuevo: 'en_produccion',
  });

  await notificarCortadoresPedidoListo(params.pedidoId);

  return { transicionado: true };
}

export async function aprobarFichaItemPedido(params: {
  fichaId: bigint;
  pedidoId: bigint;
  usuarioId: bigint;
}): Promise<{ pedidoEnProduccion: boolean; progreso: ProgresoFichasPedido }> {
  const pedido = await prisma.pedidos.findUnique({
    where: { id: params.pedidoId },
    select: { estado: true },
  });

  if (!pedido) {
    throw new Error('Pedido no encontrado');
  }

  if (pedidoFichasEnModoSoloLectura(pedido.estado)) {
    throw new Error(
      'El pedido ya está en producción o despacho. No se pueden aprobar más fichas.',
    );
  }

  const ficha = await prisma.fichas_tecnicas.findUnique({
    where: { id: params.fichaId },
    select: { id: true, estado: true, id_producto: true },
  });

  if (!ficha) {
    throw new Error('Ficha técnica no encontrada');
  }

  if (!ficha.id_producto) {
    throw new Error('La ficha no tiene producto asociado');
  }

  const productosPedido = await obtenerProductosUnicosDelPedido(params.pedidoId);
  if (!productosPedido.some((pid) => pid === ficha.id_producto)) {
    throw new Error('Este producto no pertenece al pedido');
  }

  if (ficha.estado === 'aprobada') {
    const progreso = await obtenerProgresoFichasPedido(params.pedidoId);
    return { pedidoEnProduccion: pedido.estado === 'en_produccion', progreso };
  }

  await prisma.fichas_tecnicas.update({
    where: { id: params.fichaId },
    data: { estado: 'aprobada' },
  });

  await registrarDisenoFichaAprobada({
    fichaId: params.fichaId,
    productoId: ficha.id_producto,
    pedidoId: params.pedidoId,
    usuarioId: params.usuarioId,
  });

  const resultado = await transicionarPedidoEnProduccionSiFichasCompletas({
    pedidoId: params.pedidoId,
  });

  const progreso = await obtenerProgresoFichasPedido(params.pedidoId);

  return {
    pedidoEnProduccion: resultado.transicionado,
    progreso,
  };
}
