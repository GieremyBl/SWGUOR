import { formatCurrency } from '@/lib/helpers/format-helpers';

export function formatMontoCotizacion(
  amount: number | string | null | undefined,
  moneda = 'PEN',
): string {
  const n = Number(amount ?? 0);
  if (Number.isNaN(n)) return '—';
  if (moneda === 'USD') {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(n);
  }
  if (moneda === 'EUR') {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(n);
  }
  return formatCurrency(n);
}
