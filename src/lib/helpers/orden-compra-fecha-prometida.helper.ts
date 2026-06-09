import type { CotizacionExtraccionIA } from '@/lib/schemas/cotizacion-extraccion-ia';

function parseIsoDate(raw?: string | null): string | null {
  if (!raw) return null;
  const d = raw.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return null;
  return d;
}

function addCalendarDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + Math.max(0, Math.round(days)));
  return date.toISOString().slice(0, 10);
}

/**
 * Resuelve fecha prometida para OC desde datos extraídos del PDF.
 * Prioridad: fecha explícita → plazo en días + fecha del documento.
 */
export function resolverFechaPrometidaDesdeExtraccion(
  extracted: CotizacionExtraccionIA,
): string | null {
  const cot = (extracted.cotizacion ?? {}) as {
    fecha_prometida?: string | null;
    fecha_entrega?: string | null;
    plazo_entrega_dias?: number | string | null;
    fecha_solicitud?: string | null;
  };

  const explicita =
    parseIsoDate(cot.fecha_prometida) ??
    parseIsoDate(cot.fecha_entrega);
  if (explicita) return ajustarFechaPrometidaMinima(explicita);

  const plazo = Number(cot.plazo_entrega_dias);
  if (!Number.isFinite(plazo) || plazo <= 0) return null;

  const base = parseIsoDate(cot.fecha_solicitud);
  if (!base) return null;

  return ajustarFechaPrometidaMinima(addCalendarDays(base, plazo));
}

/** Fecha mínima permitida (hoy, zona local) para fecha prometida en OC */
export function fechaMinimaPrometidaHoy(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Ajusta la fecha al mínimo hoy si viene en el pasado */
export function ajustarFechaPrometidaMinima(fecha?: string | null): string | null {
  const iso = parseIsoDate(fecha ?? null);
  if (!iso) return null;
  const min = fechaMinimaPrometidaHoy();
  return iso >= min ? iso : min;
}
