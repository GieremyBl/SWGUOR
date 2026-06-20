import type { Prisma } from '@prisma/client';
import type { MonedaAnaliticaFiltro } from '@/lib/constants/analitica-financiera';

/**
 * Cuentas por cobrar: pedidos con saldo pendiente en estado `pendiente`
 * o con pago parcial (equivalente a `pagado_parcial`, que no existe en EstadoPedido).
 */
export function buildCuentasPorCobrarWhere(
  moneda?: MonedaAnaliticaFiltro,
): Prisma.pedidosWhereInput {
  const monedaFilter =
    moneda && moneda !== 'todos' ? { moneda } : {};

  return {
    estado: { not: 'cancelado' },
    saldo_pendiente: { gt: 0 },
    ...monedaFilter,
    OR: [
      { estado: 'pendiente' },
      { monto_pagado: { gt: 0 } },
    ],
  };
}

export function buildPedidosVentasWhere(
  moneda?: MonedaAnaliticaFiltro,
): Prisma.pedidosWhereInput {
  return {
    estado: { not: 'cancelado' },
    ...(moneda && moneda !== 'todos' ? { moneda } : {}),
  };
}

export function buildPagosRecaudadosWhere(
  moneda?: MonedaAnaliticaFiltro,
): Prisma.pagosWhereInput {
  return {
    estado: { in: ['pagado', 'pago_parcial'] },
    ...(moneda && moneda !== 'todos'
      ? { pedidos: { moneda, estado: { not: 'cancelado' } } }
      : {}),
  };
}

export interface MesTendenciaSlot {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export function generarUltimosMeses(cantidad: number): MesTendenciaSlot[] {
  const meses: MesTendenciaSlot[] = [];
  const hoy = new Date();

  for (let i = cantidad - 1; i >= 0; i -= 1) {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59, 999);
    const key = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`;

    meses.push({
      key,
      label: inicio.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }),
      start: inicio,
      end: fin,
    });
  }

  return meses;
}

export function mesKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function calcularPorcentajeMorosidad(
  saldoPendiente: number,
  ingresosTotales: number,
): number {
  if (ingresosTotales <= 0) return 0;
  return Math.min(100, (saldoPendiente / ingresosTotales) * 100);
}

export function formatMontoAnalitica(value: number, moneda: MonedaAnaliticaFiltro): string {
  const symbol = moneda === 'USD' ? 'US$' : moneda === 'PEN' ? 'S/' : 'S/';
  return `${symbol} ${value.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
