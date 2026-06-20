import { ETAPAS_PRODUCCION } from '@/lib/schemas/ordenes-produccion';

export const REPORTE_MANUFACTURA_ROLES = [
  'administrador',
  'gerente',
  'cortador',
  'representante_taller',
] as const;

/** OPs consideradas activas en planta */
export const ESTADOS_OP_ACTIVAS = ['confirmada', 'en_produccion', 'pausada'] as const;

/** OPs excluidas del análisis operativo */
export const ESTADOS_OP_EXCLUIDAS = ['cancelada', 'borrador'] as const;

/** Ventana de alerta para entregas próximas */
export const MANUFACTURA_HORAS_ALERTA_ENTREGA = 48;

/** Orden canónico de etapas para gráficos */
export const ETAPAS_MANUFACTURA_ORDEN = [...ETAPAS_PRODUCCION] as const;

/** SLA de respaldo (minutos) si no hay histórico suficiente por etapa */
export const SLA_ETAPA_MINUTOS: Record<(typeof ETAPAS_PRODUCCION)[number], number> = {
  diseno: 480,
  patronaje: 360,
  corte: 240,
  confeccion: 720,
  remallado: 180,
  bordado_estampado: 300,
  control_calidad: 120,
  acabado: 180,
  listo_entrega: 60,
};
