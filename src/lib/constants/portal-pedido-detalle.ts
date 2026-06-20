import type { MisPagosVista } from '@/lib/constants/portal-mis-pagos';

export function buildMisPagosPedidoDetalleUrl(
  pedidoId: number,
  vista?: MisPagosVista,
): string {
  const base = `/portal/pagos/pedido/${pedidoId}`;
  if (vista === 'historico') {
    return `${base}?vista=historico`;
  }
  return base;
}

export function buildMisPagosVolverUrl(vista?: MisPagosVista | null): string {
  if (vista === 'historico') {
    return '/portal/pagos?vista=historico';
  }
  return '/portal/pagos';
}

export function parseMisPagosVistaParam(
  value: string | null | undefined,
): MisPagosVista {
  return value === 'historico' ? 'historico' : 'pedidos';
}
