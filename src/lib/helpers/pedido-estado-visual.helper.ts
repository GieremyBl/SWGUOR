import { ESTADO_PEDIDO_LABELS } from '@/lib/schemas/pedidos';

export const ESTADO_VISUAL_PEDIDO_LABELS: Record<string, string> = {
  ...ESTADO_PEDIDO_LABELS,
  en_ruta: 'En camino',
  preparando: 'Preparando envío',
};

export function resolverEstadoVisualPedido(
  pedidoEstado: string | null | undefined,
  despachoEstado?: string | null,
): { key: string; label: string } {
  const estado = pedidoEstado ?? 'pendiente';

  if (
    despachoEstado === 'en_ruta' &&
    estado !== 'entregado' &&
    estado !== 'cancelado'
  ) {
    return { key: 'en_ruta', label: ESTADO_VISUAL_PEDIDO_LABELS.en_ruta };
  }

  if (despachoEstado === 'preparando' && estado === 'listo_para_despacho') {
    return { key: 'preparando', label: ESTADO_VISUAL_PEDIDO_LABELS.preparando };
  }

  const label =
    ESTADO_PEDIDO_LABELS[estado as keyof typeof ESTADO_PEDIDO_LABELS] ?? estado;

  return { key: estado, label };
}
