export type EstadoReporteTaller =
  | 'completado'
  | 'en_proceso'
  | 'retrasado'
  | 'pendiente';

export interface ReporteTallerItem {
  id: number;
  taller: string;
  pedido: string;
  cantidad: number;
  avance: number;
  fechaCompromiso: string;
  estado: EstadoReporteTaller;
}

export interface ReporteTallerStats {
  talleresActivos: number;
  pedidosProduccion: number;
  avancePromedio: number;
  unidadesConfeccionadas: number;
}

export interface ReporteTallerResumen {
  completado: number;
  enProceso: number;
  retrasado: number;
  pendiente: number;
  cumplimientoGeneral: number;
}

export interface ReporteTallerResponse {
  stats: ReporteTallerStats;
  resumen: ReporteTallerResumen;
  data: ReporteTallerItem[];
}

export interface ReporteTallerFilters {
  taller?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: EstadoReporteTaller | 'todos';
}