import type { RolUsuario } from '@/lib/constants/roles';

/** Roles que pueden iniciar ruta y confirmar entrega (CUS_21). */
export const ROLES_LOGISTICA_DESPACHO: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
  'ayudante',
  'representante_taller',
  'almacenero',
];

/** Roles que pueden registrar empaque y crear despacho (back-office). */
export const ROLES_EMPAQUE_PEDIDO: RolUsuario[] = ['administrador', 'gerente'];
