import { prisma } from '@/lib/prisma';
import type { EstadoDespacho, EstadoPedido, Prisma } from '@prisma/client';

export const ESTADOS_PEDIDO_BLOQUEAN_DIRECCION: EstadoPedido[] = [
  'entregado',
  'cancelado',
];

/** Despachos activos o finalizados que impiden cambiar la dirección por el cliente. */
export const DESPACHO_ESTADOS_BLOQUEAN_EDICION_DIRECCION: EstadoDespacho[] = [
  'pendiente',
  'preparando',
  'en_ruta',
  'entregado',
];

function formatearDireccionCliente(d: {
  direccion: string;
  ciudad: string | null;
  departamento: string | null;
}): string {
  return [d.direccion, d.ciudad, d.departamento].filter(Boolean).join(', ');
}

export async function obtenerDireccionDespachoDefaultCliente(
  clienteId: bigint,
  tx?: Prisma.TransactionClient,
): Promise<string | null> {
  const db = tx ?? prisma;

  const dirPrincipal = await db.direcciones_cliente.findFirst({
    where: { cliente_id: clienteId, es_principal: true },
    select: { direccion: true, ciudad: true, departamento: true },
  });

  if (dirPrincipal?.direccion?.trim()) {
    return formatearDireccionCliente(dirPrincipal).trim();
  }

  const cliente = await db.clientes.findUnique({
    where: { id: clienteId },
    select: { direccion_fiscal: true },
  });

  const fiscal = cliente?.direccion_fiscal?.trim();
  return fiscal || null;
}

/** Completa `direccion_despacho` del pedido si está vacía (p. ej. al pasar a listo para despacho). */
export async function precargarDireccionDespachoPedido(
  tx: Prisma.TransactionClient,
  pedidoId: bigint,
  clienteId: bigint,
): Promise<void> {
  const pedido = await tx.pedidos.findUnique({
    where: { id: pedidoId },
    select: { direccion_despacho: true },
  });

  if (pedido?.direccion_despacho?.trim()) return;

  const defaultDir = await obtenerDireccionDespachoDefaultCliente(clienteId, tx);
  if (!defaultDir) return;

  await tx.pedidos.update({
    where: { id: pedidoId },
    data: { direccion_despacho: defaultDir, updated_at: new Date() },
  });
}

export function puedeClienteEditarDireccionDespacho(
  pedidoEstado: string | null | undefined,
  despachoEstado?: string | null,
): boolean {
  const estado = pedidoEstado ?? 'pendiente';

  if (ESTADOS_PEDIDO_BLOQUEAN_DIRECCION.includes(estado as EstadoPedido)) {
    return false;
  }

  if (
    despachoEstado &&
    DESPACHO_ESTADOS_BLOQUEAN_EDICION_DIRECCION.includes(
      despachoEstado as EstadoDespacho,
    )
  ) {
    return false;
  }

  return true;
}

export async function actualizarDireccionDespachoPedido(params: {
  pedidoId: bigint;
  clienteId: bigint;
  direccion: string;
}) {
  const direccion = params.direccion.trim();
  if (direccion.length < 10) {
    return {
      ok: false as const,
      status: 400,
      error: 'direccion_invalida',
      mensaje: 'Indique una dirección de entrega válida (mínimo 10 caracteres).',
    };
  }

  const pedido = await prisma.pedidos.findFirst({
    where: { id: params.pedidoId, cliente_id: params.clienteId },
    select: { id: true, estado: true },
  });

  if (!pedido) {
    return { ok: false as const, status: 404, error: 'pedido_no_encontrado' };
  }

  const despachoBloqueante = await prisma.despachos.findFirst({
    where: {
      pedido_id: params.pedidoId,
      estado: { in: DESPACHO_ESTADOS_BLOQUEAN_EDICION_DIRECCION },
    },
    select: { estado: true },
  });

  if (
    !puedeClienteEditarDireccionDespacho(
      pedido.estado,
      despachoBloqueante?.estado,
    )
  ) {
    // ── Fix: pedido.estado es EstadoPedido | null; coalesce antes de includes ─
    if (ESTADOS_PEDIDO_BLOQUEAN_DIRECCION.includes(
      (pedido.estado ?? 'pendiente') as EstadoPedido,
    )) {
      return {
        ok: false as const,
        status: 422,
        error: 'estado_no_permitido',
        mensaje: 'Este pedido ya no admite cambios en la dirección de despacho.',
      };
    }

    return {
      ok: false as const,
      status: 422,
      error: 'despacho_en_curso',
      mensaje:
        'No puede modificar la dirección: el pedido ya tiene un despacho en proceso o entregado.',
    };
  }

  const actualizado = await prisma.pedidos.update({
    where: { id: params.pedidoId },
    data: { direccion_despacho: direccion, updated_at: new Date() },
    select: { id: true, direccion_despacho: true, estado: true },
  });

  await prisma.seguimiento_pedido.create({
    data: {
      pedido_id: params.pedidoId,
      status: pedido.estado ?? 'pendiente',
      notas: `Cliente actualizó dirección de despacho: ${direccion}`,
    },
  });

  return { ok: true as const, data: actualizado };
}