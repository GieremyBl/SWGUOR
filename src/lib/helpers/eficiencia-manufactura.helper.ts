import type { EtapaProduccion } from '@prisma/client';
import {
  MANUFACTURA_HORAS_ALERTA_ENTREGA,
  SLA_ETAPA_MINUTOS,
} from '@/lib/constants/eficiencia-manufactura';
import { ETAPAS_PRODUCCION } from '@/lib/schemas/ordenes-produccion';

export function calcularDuracionMinutos(registro: {
  iniciado_en: Date;
  completado_en: Date | null;
  duracion_minutos: number | null;
}): number | null {
  if (registro.duracion_minutos != null && registro.duracion_minutos > 0) {
    return registro.duracion_minutos;
  }
  if (!registro.completado_en) return null;
  return Math.max(
    0,
    Math.round(
      (registro.completado_en.getTime() - registro.iniciado_en.getTime()) / 60_000,
    ),
  );
}

export function calcularMinutosTranscurridos(iniciadoEn: Date, referencia = new Date()): number {
  return Math.max(0, Math.round((referencia.getTime() - iniciadoEn.getTime()) / 60_000));
}

export function promedio(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calcularCumplimientoFechas(
  completadas: { fecha_entrega: Date | null; completado_en: Date | null }[],
): number {
  const evaluables = completadas.filter((op) => op.fecha_entrega && op.completado_en);
  if (!evaluables.length) return 0;

  const aTiempo = evaluables.filter((op) => {
    const entrega = new Date(op.fecha_entrega!);
    entrega.setHours(23, 59, 59, 999);
    return op.completado_en!.getTime() <= entrega.getTime();
  }).length;

  return (aTiempo / evaluables.length) * 100;
}

export function resolverTiempoEstimadoEtapa(
  etapa: EtapaProduccion,
  promediosHistoricos: Map<string, number>,
): number {
  const historico = promediosHistoricos.get(etapa);
  if (historico && historico > 0) return historico;

  const sla = SLA_ETAPA_MINUTOS[etapa as (typeof ETAPAS_PRODUCCION)[number]];
  return sla ?? 240;
}

export function clasificarUrgenciaEntrega(
  fechaEntrega: Date,
  referencia = new Date(),
): 'vencida' | 'proxima' {
  if (fechaEntrega.getTime() < referencia.getTime()) return 'vencida';
  return 'proxima';
}

export function horasHastaEntrega(fechaEntrega: Date, referencia = new Date()): number {
  return (fechaEntrega.getTime() - referencia.getTime()) / 3_600_000;
}

export function dentroVentanaAlerta(fechaEntrega: Date, referencia = new Date()): boolean {
  const limite = new Date(
    referencia.getTime() + MANUFACTURA_HORAS_ALERTA_ENTREGA * 3_600_000,
  );
  return fechaEntrega.getTime() <= limite.getTime();
}

export function formatDuracion(minutos: number): string {
  if (minutos < 60) return `${Math.round(minutos)} min`;
  const horas = Math.floor(minutos / 60);
  const mins = Math.round(minutos % 60);
  return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
}

export function formatPorcentaje(value: number): string {
  return `${value.toFixed(1)}%`;
}
