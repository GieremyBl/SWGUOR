import type { RolUsuario } from '@/lib/constants/roles';
import type { SeveridadIncidencia, TipoIncidencia } from '@prisma/client';

export const INCIDENCIAS_TALLER_ADMIN_API = '/api/admin/incidencias-taller';

export const INCIDENCIAS_TALLER_ROLES_VER: RolUsuario[] = [
  'administrador',
  'gerente',
  'representante_taller',
  'almacenero',
];

export const INCIDENCIAS_TALLER_ROLES_CREAR: RolUsuario[] = [
  'administrador',
  'gerente',
  'representante_taller',
];

export const INCIDENCIAS_TALLER_ROLES_GESTION: RolUsuario[] = [
  'administrador',
  'gerente',
];

export const TIPOS_INCIDENCIA_TALLER = [
  'averia_maquina',
  'falta_material',
  'error_diseno',
  'defecto_corte',
  'defecto_confeccion',
  'retraso',
  'otro',
] as const satisfies readonly TipoIncidencia[];

export const SEVERIDADES_INCIDENCIA_TALLER = [
  'baja',
  'media',
  'alta',
  'critica',
] as const satisfies readonly SeveridadIncidencia[];

export const TIPO_INCIDENCIA_TALLER_LABELS: Record<TipoIncidencia, string> = {
  averia_maquina: 'Avería de máquina',
  falta_material: 'Falta de material',
  error_diseno: 'Error de diseño',
  defecto_corte: 'Defecto de corte',
  defecto_confeccion: 'Defecto de confección',
  retraso: 'Retraso',
  otro: 'Otro',
};

export const SEVERIDAD_INCIDENCIA_LABELS: Record<SeveridadIncidencia, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

export const SEVERIDAD_INCIDENCIA_STYLES: Record<SeveridadIncidencia, string> = {
  baja: 'bg-slate-100 text-slate-700 border-slate-200',
  media: 'bg-amber-50 text-amber-800 border-amber-200',
  alta: 'bg-orange-50 text-orange-800 border-orange-200',
  critica: 'bg-rose-50 text-rose-800 border-rose-200',
};

export const ESTADO_RESOLUCION_LABELS = {
  pendiente: 'Pendiente',
  resuelto: 'Resuelto',
} as const;

export const ESTADO_RESOLUCION_STYLES = {
  pendiente: 'bg-amber-50 text-amber-800 border-amber-200',
  resuelto: 'bg-emerald-50 text-emerald-800 border-emerald-200',
} as const;
