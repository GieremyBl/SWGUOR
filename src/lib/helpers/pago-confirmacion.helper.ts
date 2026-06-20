const CULQI_CHARGE_ID_REGEX = /charge_id=([^\s|]+)/;

export function extraerCulqiChargeIdDeNotas(notas?: string | null): string | null {
  if (!notas?.trim()) return null;
  return notas.match(CULQI_CHARGE_ID_REGEX)?.[1] ?? null;
}

export function formatearMontoPortal(monto: number, moneda = 'PEN'): string {
  const simbolo = moneda === 'USD' ? 'US$' : 'S/';
  return `${simbolo} ${Number(monto).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatearFechaPortal(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—';
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatearFechaCortaPortal(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—';
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
