import { prisma } from '@/lib/prisma';
import { requireServerAuth } from '@/lib/auth/server';
import {
  calcularFechaEntregaEstimada,
  formatearEtaLegible,
} from '@/lib/helpers/pedido-seguimiento.helper';
import { puedeClienteEditarDireccionDespacho } from '@/lib/helpers/pedido-direccion.helper';
import { resolverEstadoPagoHistorialPortal } from '@/lib/helpers/portal-historial-pagos.helper';
import type { EstadoPedido } from '@prisma/client';

export async function obtenerClienteIdPortal() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { error: auth.error, status: auth.status } as const;
  }

  const cliente = await prisma.clientes.findFirst({
    where: { usuario_id: auth.user.id },
    select: { id: true, estado: true },
  });

  if (!cliente) {
    return { error: 'cliente_no_encontrado', status: 404 } as const;
  }

  if (cliente.estado !== 'activo') {
    return { error: 'cliente_inactivo', status: 403 } as const;
  }

  return { cliente_id: cliente.id } as const;
}

type PedidosQueryOptions = {
  incluirFinalizados?: boolean;
};

async function consultarPedidosCliente(
  clienteId: bigint,
  options: PedidosQueryOptions = {},
) {
  return prisma.pedidos.findMany({
    where: {
      cliente_id: clienteId,
      ...(options.incluirFinalizados
        ? {}
        : { estado: { notIn: ['entregado', 'cancelado'] } }),
    },
    include: {
      clientes: {
        select: {
          razon_social: true,
          nombre_comercial: true,
          email: true,
        },
      },
      seguimiento_pedido: {
        orderBy: { created_at: 'asc' },
      },
      pagos: {
        where: { estado: { not: 'anulado' } },
        select: {
          estado: true,
          tipo: true,
          monto: true,
          fecha_pago: true,
        },
        orderBy: { fecha_pago: 'desc' },
      },
      pedido_items: {
        select: { cantidad: true },
      },
      despachos: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { estado: true },
      },
    },
    orderBy: { id: 'desc' },
  });
}

function mapHistorialPedido(
  seguimiento: Awaited<ReturnType<typeof consultarPedidosCliente>>[number]['seguimiento_pedido'],
) {
  return seguimiento.map((s) => ({
    id: Number(s.id),
    pedido_id: Number(s.pedido_id),
    status: s.status as EstadoPedido,
    notas: s.notas,
    created_at: s.created_at?.toISOString() ?? new Date().toISOString(),
    updated_at: s.updated_at?.toISOString() ?? new Date().toISOString(),
    creado_por: s.creado_por,
  }));
}

export async function listarPedidosDetallePortal(options: PedidosQueryOptions = {}) {
  const sesion = await obtenerClienteIdPortal();
  if ('error' in sesion) {
    return sesion;
  }

  const pedidos = await consultarPedidosCliente(sesion.cliente_id, options);

  const data = pedidos.map((p) => {
    const historial = mapHistorialPedido(p.seguimiento_pedido);
    const ultima =
      historial.at(-1)?.created_at ?? p.created_at?.toISOString() ?? null;
    const eta = calcularFechaEntregaEstimada(
      p.created_at ?? new Date(),
      p.estado,
    );

    const montoPagado = Number(p.monto_pagado ?? 0);
    const saldoPendiente = Number(p.saldo_pendiente ?? 0);
    const estadoPagoResumen = resolverEstadoPagoHistorialPortal(
      montoPagado,
      saldoPendiente,
    );

    return {
      id: Number(p.id),
      codigo: `ORD-${String(p.id).padStart(4, '0')}`,
      estado: p.estado ?? 'pendiente',
      total: Number(p.total),
      moneda: p.moneda ?? 'PEN',
      monto_pagado: montoPagado,
      saldo_pendiente: saldoPendiente,
      estado_pago: estadoPagoResumen === 'pagado' ? 'verificado' : 'pendiente',
      cliente:
        p.clientes?.nombre_comercial ??
        p.clientes?.razon_social ??
        'Cliente',
      email: p.clientes?.email ?? null,
      created_at: p.created_at?.toISOString() ?? new Date().toISOString(),
      fecha_entrega_est: eta.toISOString(),
      fecha_entrega_est_texto: formatearEtaLegible(eta),
      total_unidades: p.total_unidades ?? 0,
      notas_cliente: p.notas_cliente,
      direccion_despacho: p.direccion_despacho,
      puede_editar_direccion: puedeClienteEditarDireccionDespacho(
        p.estado,
        p.despachos[0]?.estado,
      ),
      historial,
      ultimaActualizacion: ultima,
      pagos: p.pagos.map((pago) => ({
        estado: pago.estado,
        tipo: pago.tipo,
        monto: Number(pago.monto),
        fecha_pago: pago.fecha_pago?.toISOString() ?? null,
      })),
    };
  });

  return { data } as const;
}

export async function listarPedidosContextoPortal() {
  const sesion = await obtenerClienteIdPortal();
  if ('error' in sesion) {
    return sesion;
  }

  const pedidos = await consultarPedidosCliente(sesion.cliente_id, {
    incluirFinalizados: true,
  });

  const data = pedidos.map((p) => {
    const historial = mapHistorialPedido(p.seguimiento_pedido).map((h) => ({
      id: h.id,
      pedido_id: h.pedido_id,
      status: h.status,
      notas: h.notas,
      created_at: h.created_at,
    }));

    const montoPagado = Number(p.monto_pagado ?? 0);
    const saldoPendiente = Number(p.saldo_pendiente ?? 0);
    const estadoPagoResumen = resolverEstadoPagoHistorialPortal(
      montoPagado,
      saldoPendiente,
    );
    const itemsCount = p.pedido_items.reduce(
      (acc, item) => acc + (item.cantidad ?? 0),
      0,
    );

    return {
      id: Number(p.id),
      codigo_pedido: `ORD-${String(p.id).padStart(4, '0')}`,
      fecha_compra: p.created_at?.toISOString() ?? new Date().toISOString(),
      monto_total: Number(p.total),
      estado_pago: estadoPagoResumen === 'pagado' ? 'verificado' : 'pendiente',
      estado_pedido: p.estado ?? 'pendiente',
      items_count: itemsCount,
      historial,
    };
  });

  return { data } as const;
}
