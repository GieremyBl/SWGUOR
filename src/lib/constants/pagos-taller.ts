import type { RolUsuario } from '@/lib/constants/roles';
import type { EstadoPagoTaller, MetodoPago } from '@prisma/client';

export const PAGOS_TALLER_ADMIN_API = '/api/admin/pagos-taller';

export const PAGOS_TALLER_ROLES_VER: RolUsuario[] = [
  'administrador',
  'gerente',
  'representante_taller',
];

export const PAGOS_TALLER_ROLES_ESCRITURA: RolUsuario[] = [
  'administrador',
  'gerente',
];

export const METODOS_PAGO_TALLER = [
  'efectivo',
  'transferencia_bcp',
  'yape',
  'plin',
  'visa',
  'mastercard',
] as const satisfies readonly MetodoPago[];

export const ESTADOS_PAGO_TALLER_FILTRO = [
  'pendiente',
  'pagado',
  'anulado',
] as const satisfies readonly EstadoPagoTaller[];

export const METODO_PAGO_TALLER_LABELS: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia_bcp: 'Transferencia BCP',
  yape: 'Yape',
  plin: 'Plin',
  visa: 'Visa',
  mastercard: 'Mastercard',
};

export const ESTADO_PAGO_TALLER_LABELS: Record<EstadoPagoTaller, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  anulado: 'Anulado',
};

export const ESTADO_PAGO_TALLER_STYLES: Record<EstadoPagoTaller, string> = {
  pendiente: 'bg-amber-50 text-amber-800 border-amber-200',
  pagado: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  anulado: 'bg-slate-100 text-slate-600 border-slate-200',
};
