import type { RolUsuario } from '@/lib/constants/roles';
import type { EstadoDevolucionProv, MotivoDevolucionProv } from '@prisma/client';

export const DEVOLUCIONES_PROVEEDOR_API = '/api/admin/devoluciones-proveedor';

export const DEVOLUCIONES_PROVEEDOR_ROLES_VER: RolUsuario[] = [
  'administrador',
  'gerente',
  'almacenero',
];

export const DEVOLUCIONES_PROVEEDOR_ROLES_CREAR: RolUsuario[] = [
  'administrador',
  'gerente',
  'almacenero',
];

export const DEVOLUCIONES_PROVEEDOR_ROLES_EDITAR: RolUsuario[] = [
  'administrador',
  'gerente',
  'almacenero',
];

/** Estados desde los que se puede avanzar el seguimiento logístico (solo insumos en tabla). */
export const ESTADOS_DEVOLUCION_PROV_EDITABLES: EstadoDevolucionProv[] = [
  'pendiente_envio',
  'en_transito',
  'aceptado_proveedor',
];

export const TRANSICIONES_DEVOLUCION_PROV: Record<
  EstadoDevolucionProv,
  EstadoDevolucionProv[]
> = {
  pendiente_envio: ['en_transito'],
  en_transito: ['aceptado_proveedor', 'rechazado_proveedor', 'completado'],
  aceptado_proveedor: ['completado'],
  rechazado_proveedor: [],
  completado: [],
};

export const MOTIVO_DEVOLUCION_PROV_LABELS: Record<MotivoDevolucionProv, string> = {
  insumo_defectuoso: 'Insumo defectuoso',
  no_cumple_especificaciones: 'No cumple especificaciones',
  exceso_pedido: 'Exceso de pedido',
  pedido_incompleto_danado: 'Pedido incompleto / dañado',
  vencimiento: 'Vencimiento',
  otros: 'Otros',
};

export const ESTADO_DEVOLUCION_PROV_LABELS: Record<EstadoDevolucionProv, string> = {
  pendiente_envio: 'Pendiente de envío',
  en_transito: 'En tránsito',
  aceptado_proveedor: 'Aceptado por proveedor',
  rechazado_proveedor: 'Rechazado por proveedor',
  completado: 'Completado',
};

export const ESTADO_DEVOLUCION_PROV_STYLES: Record<EstadoDevolucionProv, string> = {
  pendiente_envio: 'bg-amber-50 text-amber-800 border-amber-200',
  en_transito: 'bg-blue-50 text-blue-800 border-blue-200',
  aceptado_proveedor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rechazado_proveedor: 'bg-red-50 text-red-800 border-red-200',
  completado: 'bg-slate-100 text-slate-700 border-slate-200',
};

/** Prefijo en motivo de movimiento para devoluciones de material (sin fila en devoluciones_proveedor). */
export const DEV_PROV_MATERIAL_MOTIVO_PREFIX = '[DEV_PROV_MAT]';
