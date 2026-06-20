import { prisma } from '@/lib/prisma';
import type { AbonoPedido, PedidoPagosResumen } from '@/lib/schemas/portal-pedido-pagos';

export async function obtenerPagosPedidoPortal(
  pedidoId: bigint,
  clienteId: bigint,
): Promise<PedidoPagosResumen | null> {
  const pedido = await prisma.pedidos.findFirst({
    where: { id: pedidoId, cliente_id: clienteId },
    select: {
      id: true,
      total: true,
      monto_pagado: true,
      saldo_pendiente: true,
      moneda: true,
    },
  });

  if (!pedido) return null;

  const pagos = await prisma.pagos.findMany({
    where: { pedido_id: pedidoId },
    orderBy: { fecha_pago: 'desc' },
    select: {
      id_uuid: true,
      monto: true,
      estado: true,
      fecha_pago: true,
      tipo: true,
      metodo_pago: true,
      comprobantes: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: {
          id_uuid: true,
          numero_completo: true,
        },
      },
    },
  });

  const abonos: AbonoPedido[] = pagos.map((pago) => {
    const comprobanteRaw = pago.comprobantes[0] ?? null;
    return {
      id: pago.id_uuid,
      monto: Number(pago.monto),
      estado: pago.estado,
      fecha_pago: pago.fecha_pago.toISOString(),
      tipo: pago.tipo,
      metodo_pago: pago.metodo_pago,
      comprobante: comprobanteRaw
        ? {
            id: comprobanteRaw.id_uuid,
            numero_completo: comprobanteRaw.numero_completo,
          }
        : null,
    };
  });

  return {
    pedido_id: Number(pedido.id),
    monto_total: Number(pedido.total ?? 0),
    monto_pagado: Number(pedido.monto_pagado ?? 0),
    saldo_pendiente: Number(pedido.saldo_pendiente ?? 0),
    moneda: pedido.moneda ?? 'PEN',
    abonos,
  };
}
