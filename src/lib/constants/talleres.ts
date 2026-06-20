import { ESPECIALIDADES_TALLER, ESTADOS_TALLER } from '@/lib/schemas/talleres';

export const ESPECIALIDAD_TALLER_LABELS: Record<(typeof ESPECIALIDADES_TALLER)[number], string> = {
  corte: 'Corte',
  costura: 'Costura',
  confeccion: 'Confección',
  bordado: 'Bordado',
  estampado: 'Estampado',
  acabados: 'Acabados',
  otro: 'Otro',
};

export const ESTADO_TALLER_LABELS: Record<(typeof ESTADOS_TALLER)[number], string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  suspendido: 'Suspendido',
};
