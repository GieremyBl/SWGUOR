import type { AbonoPedido } from '@/lib/schemas/portal-pedido-pagos';
import type { HistorialPagoFila } from '@/lib/schemas/portal-historial-pagos';

/** Estados de pago expuestos al portal en el historial de transacciones */
export type EstadoPagoHistorialPortal = 'pendiente' | 'parcial' | 'pagado';

export function resolverEstadoPagoHistorialPortal(
  montoPagado: number,
  saldoPendiente: number,
): EstadoPagoHistorialPortal {
  const pagado = Number(montoPagado);
  const saldo = Number(saldoPendiente);

  if (pagado > 0 && saldo <= 0) return 'pagado';
  if (pagado > 0 && saldo > 0) return 'parcial';
  return 'pendiente';
}

export interface HistorialPagoTransaccion {
  pago_id: string;
  pedido_id: number;
  codigo: string;
  estado_pedido: string;
  monto_total: number;
  monto_pagado_pedido: number;
  saldo_pendiente: number;
  moneda: string;
  total_unidades: number;
  abono: AbonoPedido;
}

/** Aplana abonos de todos los pedidos y ordena del más reciente al más antiguo. */
export function buildHistorialTransaccionesRecientes(
  filas: HistorialPagoFila[],
): HistorialPagoTransaccion[] {
  const transacciones: HistorialPagoTransaccion[] = [];

  for (const fila of filas) {
    for (const abono of fila.abonos ?? []) {
      transacciones.push({
        pago_id: abono.id,
        pedido_id: fila.pedido_id,
        codigo: fila.codigo,
        estado_pedido: fila.estado_pedido,
        monto_total: fila.monto_total,
        monto_pagado_pedido: fila.monto_pagado,
        saldo_pendiente: fila.saldo_pendiente,
        moneda: fila.moneda,
        total_unidades: fila.total_unidades,
        abono,
      });
    }
  }

  return transacciones.sort(
    (a, b) =>
      new Date(b.abono.fecha_pago).getTime() - new Date(a.abono.fecha_pago).getTime(),
  );
}
