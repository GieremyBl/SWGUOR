import type { EstadoPago, MetodoPago } from '@prisma/client';

/** Filtros de estado expuestos en la UI de Tesorería */
export type EstadoTesoreriaFiltro = 'todos' | 'exitoso' | 'pendiente' | 'fallido';

export const TESORERIA_PAGOS_PAGE_SIZE_DEFAULT = 15;

export const ESTADOS_TESORERIA_LABELS: Record<EstadoTesoreriaFiltro, string> = {
  todos: 'Todos',
  exitoso: 'Exitoso',
  pendiente: 'Pendiente',
  fallido: 'Fallido',
};

/** Mapeo UI → estados reales en `pagos.estado` (Prisma) */
export function mapEstadoTesoreriaFiltroAPrisma(
  filtro: EstadoTesoreriaFiltro,
): EstadoPago[] | undefined {
  switch (filtro) {
    case 'exitoso':
      return ['pagado', 'pago_parcial'];
    case 'pendiente':
      return ['pendiente'];
    case 'fallido':
      return ['anulado'];
    default:
      return undefined;
  }
}

/** Mapeo Prisma → etiqueta UI de Tesorería */
export function mapEstadoPagoATesoreria(
  estado: EstadoPago | string,
): Exclude<EstadoTesoreriaFiltro, 'todos'> {
  if (estado === 'pagado' || estado === 'pago_parcial') return 'exitoso';
  if (estado === 'anulado') return 'fallido';
  return 'pendiente';
}

export const METODOS_PAGO_TESORERIA: { value: MetodoPago | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos los métodos' },
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'transferencia_bcp', label: 'Transferencia BCP' },
  { value: 'efectivo', label: 'Efectivo' },
];

export const METODO_PAGO_TESORERIA_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia_bcp: 'Transferencia BCP',
  yape: 'Yape',
  plin: 'Plin',
  visa: 'Visa',
  mastercard: 'Mastercard',
};
