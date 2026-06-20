import type { RolUsuario } from '@/lib/constants/roles';
import type { CondicionProducto, EstadoDevolucion, MotivoDevolucion } from '@prisma/client';

export const DEVOLUCIONES_CLIENTE_API = '/api/admin/devoluciones-cliente';

export const DEVOLUCIONES_CLIENTE_ROLES_VER: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
];

export const DEVOLUCIONES_CLIENTE_ROLES_CREAR: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
];

export const DEVOLUCIONES_CLIENTE_ROLES_RESOLVER: RolUsuario[] = [
  'administrador',
  'gerente',
];

export const ESTADOS_DEVOLUCION_PENDIENTES: EstadoDevolucion[] = [
  'pendiente',
  'en_revision',
];

export const MOTIVO_DEVOLUCION_LABELS: Record<MotivoDevolucion, string> = {
  defecto_fabrica: 'Defecto de fábrica',
  talla_incorrecta: 'Talla incorrecta',
  error_envio: 'Error de envío',
  insatisfaccion: 'Insatisfacción',
  danado_transporte: 'Dañado en transporte',
  otros: 'Otros',
};

export const ESTADO_DEVOLUCION_LABELS: Record<EstadoDevolucion, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  completada: 'Completada',
  anulada: 'Anulada',
};

export const ESTADO_DEVOLUCION_STYLES: Record<EstadoDevolucion, string> = {
  pendiente: 'bg-amber-50 text-amber-800 border-amber-200',
  en_revision: 'bg-blue-50 text-blue-800 border-blue-200',
  aprobada: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rechazada: 'bg-red-50 text-red-800 border-red-200',
  completada: 'bg-slate-100 text-slate-700 border-slate-200',
  anulada: 'bg-slate-200 text-slate-500 border-slate-300',
};

export const CONDICION_PRODUCTO_LABELS: Record<CondicionProducto, string> = {
  perfecto_estado: 'Perfecto estado',
  reproceso: 'Reproceso',
  segunda: 'Segunda',
  merma: 'Merma',
  sucio: 'Sucio',
};
