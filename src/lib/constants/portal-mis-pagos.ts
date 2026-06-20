export type MisPagosVista = 'pedidos' | 'historico';

export const MIS_PAGOS_VISTAS: Array<{
  id: MisPagosVista;
  label: string;
  description: string;
}> = [
  {
    id: 'pedidos',
    label: 'Por pedidos',
    description: 'Agrupa los pagos bajo cada pedido',
  },
  {
    id: 'historico',
    label: 'Histórico',
    description: 'Transacciones más recientes primero',
  },
];
