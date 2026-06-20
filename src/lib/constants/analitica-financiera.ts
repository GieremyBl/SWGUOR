/** Monedas soportadas en el reporte de analítica financiera */
export type MonedaAnaliticaFiltro = 'todos' | 'PEN' | 'USD';

export const ANALITICA_FINANCIERA_MESES_TENDENCIA = 12;

export const MONEDA_ANALITICA_OPCIONES: { value: MonedaAnaliticaFiltro; label: string }[] = [
  { value: 'todos', label: 'Todas las monedas' },
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

/** Estados de pago considerados como recaudación efectiva */
export const ESTADOS_PAGO_RECAUDADO = ['pagado', 'pago_parcial'] as const;
