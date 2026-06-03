export interface ReporteIncidenciaItem {
  id: number;

  taller: string;

  tipo: string;

  severidad: string;

  impactoHoras: number;

  fecha: string;

  estado: string;
}

export interface ReporteIncidenciasStats {
  totalIncidencias: number;

  incidenciasCriticas: number;

  talleresAfectados: number;

  impactoHoras: number;
}

export interface ReporteIncidenciasResumen {

  baja: number;

  media: number;

  alta: number;

  critica: number;
}

export interface ReporteIncidenciasMensual {

  mes: string;

  total: number;
}

export interface ReporteIncidenciasResponse {

  stats: ReporteIncidenciasStats;

  resumen: ReporteIncidenciasResumen;

  mensual: ReporteIncidenciasMensual[];

  data: ReporteIncidenciaItem[];
}