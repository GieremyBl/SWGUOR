import { z } from 'zod';

export const reporteManufacturaQuerySchema = z.object({}).default({});

export type ReporteManufacturaQuery = z.infer<typeof reporteManufacturaQuerySchema>;

export interface ManufacturaKpis {
  ordenes_activas: number;
  tiempo_promedio_confeccion_min: number;
  cumplimiento_fechas_pct: number;
  prendas_producidas: number;
  prendas_solicitadas: number;
  ratio_produccion_pct: number;
}

export interface ManufacturaEtapaFunnel {
  etapa: string;
  label: string;
  ordenes: number;
}

export interface ManufacturaCuelloBotella {
  etapa: string;
  label: string;
  tiempo_estimado_min: number;
  tiempo_actual_promedio_min: number;
  exceso_minutos: number;
  ordenes_activas: number;
}

export interface ManufacturaPrioridadOp {
  id: number;
  producto: string;
  taller: string;
  etapa_actual: string;
  etapa_label: string;
  fecha_entrega: string;
  horas_restantes: number;
  cantidad_solicitada: number;
  estado: string;
  urgencia: 'vencida' | 'proxima';
}

export interface ReporteManufacturaEficienciaResponse {
  success: true;
  kpis: ManufacturaKpis;
  etapas_funnel: ManufacturaEtapaFunnel[];
  cuellos_botella: ManufacturaCuelloBotella[];
  prioridad_ops: ManufacturaPrioridadOp[];
}
