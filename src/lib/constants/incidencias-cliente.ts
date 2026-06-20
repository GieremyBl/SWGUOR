import type { RolUsuario } from '@/lib/constants/roles';
import type { TipoIncidenciaCliente } from '@prisma/client';

export const INCIDENCIAS_CLIENTE_PORTAL_API = '/api/portal/incidencias-cliente';
export const INCIDENCIAS_CLIENTE_ADMIN_API = '/api/admin/incidencias-cliente';

export const INCIDENCIAS_CLIENTE_ROLES_VER: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
  'representante_taller',
  'almacenero',
];

export const INCIDENCIAS_CLIENTE_ROLES_RESPONDER: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
];

export const ESTADOS_INCIDENCIA_CLIENTE = [
  'abierta',
  'en_revision',
  'resuelta',
  'cerrada',
] as const;

export type EstadoIncidenciaCliente = (typeof ESTADOS_INCIDENCIA_CLIENTE)[number];

export const ESTADO_INCIDENCIA_LABELS: Record<EstadoIncidenciaCliente, string> = {
  abierta: 'Abierta',
  en_revision: 'En revisión',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
};

export const ESTADO_INCIDENCIA_STYLES: Record<EstadoIncidenciaCliente, string> = {
  abierta: 'bg-amber-50 text-amber-800 border-amber-200',
  en_revision: 'bg-blue-50 text-blue-800 border-blue-200',
  resuelta: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cerrada: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const TIPO_INCIDENCIA_CLIENTE_LABELS: Record<TipoIncidenciaCliente, string> = {
  defecto_confeccion: 'Defecto en confección',
  pedido_equivocado: 'Pedido equivocado',
  talla_incorrecta: 'Talla incorrecta',
  cantidad_incorrecta: 'Cantidad incorrecta',
  dano_en_transporte: 'Daño en transporte',
  empaque_defectuoso: 'Empaque defectuoso',
  otro: 'Otro',
};
