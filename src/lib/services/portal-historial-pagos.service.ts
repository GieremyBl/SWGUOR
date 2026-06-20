import { prisma } from '@/lib/prisma';
import { resolverEstadoPagoHistorialPortal } from '@/lib/helpers/portal-historial-pagos.helper';
import type { AbonoPedido } from '@/lib/schemas/portal-pedido-pagos';
import type { HistorialPagoFila } from '@/lib/schemas/portal-historial-pagos';

function formatearCodigoPedido(id: bigint | number): string {
  return `ORD-${String(id).padStart(4, '0')}`;
}

function mapPagoToAbono(pago: {
  id_uuid: string;
  monto: unknown;
  estado: AbonoPedido['estado'];
  fecha_pago: Date;
  tipo: string;
  metodo_pago: string;
  comprobantes: Array<{
    id_uuid: string;
    numero_completo: string | null;
    serie: string;
    correlativo: string;
    tipo: string;
  }>;
}): AbonoPedido {
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
}

export async function listarHistorialPagosPortal(
  clienteId: bigint,
): Promise<HistorialPagoFila[]> {
  const pedidos = await prisma.pedidos.findMany({
    where: { cliente_id: clienteId },
    select: {
      id: true,
      estado: true,
      total: true,
      monto_pagado: true,
      saldo_pendiente: true,
      moneda: true,
      created_at: true,
      total_unidades: true,
      pagos: {
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
              serie: true,
              correlativo: true,
              tipo: true,
            },
          },
        },
      },
      comprobantes: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: {
          id_uuid: true,
          numero_completo: true,
          serie: true,
          correlativo: true,
          tipo: true,
          pago_id: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return pedidos.map((pedido) => {
    const abonos = pedido.pagos.map(mapPagoToAbono);
    const ultimoPagoEfectuado = abonos.find((a) => a.estado === 'pagado') ?? abonos[0];
    const comprobantePagoRaw = pedido.pagos.find((p) => p.estado === 'pagado')?.comprobantes[0]
      ?? pedido.pagos[0]?.comprobantes[0]
      ?? null;
    const comprobanteFallback = pedido.comprobantes[0] ?? null;
    const comprobanteRaw = comprobantePagoRaw
      ? {
          id: comprobantePagoRaw.id_uuid,
          numero_completo: comprobantePagoRaw.numero_completo,
          serie: comprobantePagoRaw.serie,
          correlativo: comprobantePagoRaw.correlativo,
          tipo: comprobantePagoRaw.tipo,
        }
      : comprobanteFallback
        ? {
            id: comprobanteFallback.id_uuid,
            numero_completo: comprobanteFallback.numero_completo,
            serie: comprobanteFallback.serie,
            correlativo: comprobanteFallback.correlativo,
            tipo: comprobanteFallback.tipo,
          }
        : null;

    const montoPagado = Number(pedido.monto_pagado ?? 0);
    const saldoPendiente = Number(pedido.saldo_pendiente ?? 0);
    const estadoPago = resolverEstadoPagoHistorialPortal(montoPagado, saldoPendiente);

    const fecha =
      ultimoPagoEfectuado?.fecha_pago ??
      pedido.created_at?.toISOString() ??
      new Date().toISOString();

    return {
      pedido_id: Number(pedido.id),
      codigo: formatearCodigoPedido(pedido.id),
      estado_pedido: pedido.estado ?? 'pendiente',
      estado_pago: estadoPago,
      fecha,
      monto_total: Number(pedido.total ?? 0),
      monto_pagado: montoPagado,
      saldo_pendiente: saldoPendiente,
      moneda: pedido.moneda ?? 'PEN',
      total_unidades: pedido.total_unidades ?? 0,
      pago_id: ultimoPagoEfectuado?.id ?? comprobanteFallback?.pago_id ?? null,
      comprobante: comprobanteRaw,
      abonos,
    } satisfies HistorialPagoFila;
  });
}
