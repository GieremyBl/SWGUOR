import type { EstadoDespacho, EstadoPedido } from '@prisma/client';
import { PASOS_TRACKER_PEDIDO } from '@/lib/constants/pedido-tracker';

export type PasoTrackerEstado = 'completado' | 'actual' | 'pendiente';

export interface PasoTrackerCalculado {
  key: string;
  label: string;
  estadoVisual: PasoTrackerEstado;
}

/** Índice del paso activo (0–4). Si el pedido está entregado, devuelve 5 (todos completados). */
export function calcularIndicePasoActual(
  pedidoEstado: EstadoPedido | string | null,
  despachoEstado: EstadoDespacho | string | null | undefined,
): number {
  const estado = pedidoEstado ?? 'pendiente';

  if (estado === 'entregado' || despachoEstado === 'entregado') {
    return PASOS_TRACKER_PEDIDO.length;
  }

  if (despachoEstado === 'en_ruta') {
    return 3;
  }

  if (estado === 'listo_para_despacho') return 2;
  if (estado === 'en_produccion') return 1;
  if (estado === 'pendiente' || estado === 'pagado') return 0;

  if (estado === 'cancelado') return 0;

  return 0;
}

export function calcularPasosTracker(
  pedidoEstado: EstadoPedido | string | null,
  despachoEstado: EstadoDespacho | string | null | undefined,
): PasoTrackerCalculado[] {
  const indiceActual = calcularIndicePasoActual(pedidoEstado, despachoEstado);

  return PASOS_TRACKER_PEDIDO.map((paso, i) => {
    let estadoVisual: PasoTrackerEstado = 'pendiente';
    if (indiceActual >= PASOS_TRACKER_PEDIDO.length) {
      estadoVisual = 'completado';
    } else if (i < indiceActual) {
      estadoVisual = 'completado';
    } else if (i === indiceActual) {
      estadoVisual = 'actual';
    }
    return { key: paso.key, label: paso.label, estadoVisual };
  });
}

export function formatearFechaEntrega(
  fecha: Date | string | null | undefined,
): string | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
