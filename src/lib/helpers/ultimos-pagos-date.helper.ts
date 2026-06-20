export type UltimosPagosRangoPreset = 'todos' | 'hoy' | 'semana' | 'mes';

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

export function rangoFechasUltimosPagos(
  preset: UltimosPagosRangoPreset,
): { fecha_desde: string; fecha_hasta: string } {
  const hoy = new Date();

  switch (preset) {
    case 'hoy':
      return { fecha_desde: toIsoDate(hoy), fecha_hasta: toIsoDate(hoy) };
    case 'semana': {
      const desde = new Date(hoy);
      desde.setDate(desde.getDate() - 7);
      return { fecha_desde: toIsoDate(desde), fecha_hasta: toIsoDate(hoy) };
    }
    case 'mes': {
      const desde = new Date(hoy);
      desde.setDate(desde.getDate() - 30);
      return { fecha_desde: toIsoDate(desde), fecha_hasta: toIsoDate(hoy) };
    }
    default:
      return { fecha_desde: '', fecha_hasta: '' };
  }
}

export const ULTIMOS_PAGOS_RANGO_LABELS: Record<UltimosPagosRangoPreset, string> = {
  todos: 'Todos',
  hoy: 'Hoy',
  semana: 'Últimos 7 días',
  mes: 'Últimos 30 días',
};
