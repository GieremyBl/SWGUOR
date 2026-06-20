import type { MotivoPerdidaCotizacion } from '@/lib/constants/conversion-comercial';

export function mesKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function generarUltimosMeses(cantidad: number): { key: string; label: string }[] {
  const meses: { key: string; label: string }[] = [];
  const hoy = new Date();

  for (let i = cantidad - 1; i >= 0; i -= 1) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({
      key: mesKeyFromDate(d),
      label: d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }),
    });
  }

  return meses;
}

export function calcularTasaCierre(convertidas: number, creadas: number): number {
  if (creadas <= 0) return 0;
  return Math.min(100, (convertidas / creadas) * 100);
}

export function formatPorcentaje(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatMontoFacturacion(value: number, moneda = 'PEN'): string {
  const symbol = moneda === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${value.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function clasificarMotivoPerdida(cotizacion: {
  cliente_id: bigint | null;
  aprobado_at: Date | null;
  valida_hasta: Date;
  pedidos_count: number;
}): MotivoPerdidaCotizacion {
  if (!cotizacion.cliente_id) return 'sin_cliente';
  if (cotizacion.aprobado_at && cotizacion.pedidos_count === 0) {
    return 'aprobada_sin_conversion';
  }
  if (!cotizacion.aprobado_at) return 'sin_aprobacion';
  return 'vencimiento_validez';
}

export function esCotizacionConvertida(
  estado: string | null,
  pedidosCount: number,
): boolean {
  return estado === 'convertida' || pedidosCount > 0;
}

export function esCotizacionAprobada(
  estado: string | null,
  aprobadoAt: Date | null,
): boolean {
  return aprobadoAt != null || estado === 'aprobada' || estado === 'convertida';
}
