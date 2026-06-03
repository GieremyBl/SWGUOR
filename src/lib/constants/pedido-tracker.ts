import type { EstadoPedido } from '@prisma/client';

export type TrackerStepKey =
  | 'pendiente'
  | 'en_produccion'
  | 'listo_para_despacho'
  | 'en_ruta'
  | 'entregado';

export interface TrackerStepDef {
  key: TrackerStepKey;
  label: string;
  /** Estado de pedido que activa este paso como actual (excepto en_ruta). */
  pedidoEstado?: EstadoPedido;
  /** Si true, el paso depende del despacho en_ruta. */
  usaDespacho?: boolean;
}

export const PASOS_TRACKER_PEDIDO: TrackerStepDef[] = [
  { key: 'pendiente', label: 'Pedido recibido', pedidoEstado: 'pendiente' },
  { key: 'en_produccion', label: 'En producción', pedidoEstado: 'en_produccion' },
  {
    key: 'listo_para_despacho',
    label: 'Listo para despacho',
    pedidoEstado: 'listo_para_despacho',
  },
  { key: 'en_ruta', label: 'En camino', usaDespacho: true },
  { key: 'entregado', label: 'Entregado', pedidoEstado: 'entregado' },
];

export { DESPACHO_ESTADOS_BLOQUEAN_EDICION_DIRECCION as DESPACHO_ESTADOS_BLOQUEAN_DIRECCION } from '@/lib/helpers/pedido-direccion.helper';
