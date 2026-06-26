import type { RolUsuario } from '@/lib/constants/roles';

/** Roles que pueden iniciar ruta y agrupar despachos (no incluye confirmar entrega). */
export const ROLES_LOGISTICA_DESPACHO: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
  'ayudante',
  'representante_taller',
  'almacenero',
];

/** Solo el ayudante puede confirmar entrega y marcar el pedido como entregado. */
export const ROLES_CONFIRMAR_ENTREGA_PEDIDO: RolUsuario[] = ['ayudante'];

/** Roles que pueden registrar empaque y crear despacho (back-office). */
export const ROLES_EMPAQUE_PEDIDO: RolUsuario[] = ['administrador', 'gerente', 'ayudante'];

/** Roles con acceso de consulta al módulo de pedidos (listado y detalle). */
export const ROLES_PEDIDOS_CONSULTA: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
  'disenador',
  'cortador',
  'representante_taller',
  'ayudante',
];
