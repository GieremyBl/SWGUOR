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
export const ROLES_EMPAQUE_PEDIDO: RolUsuario[] = ['administrador', 'gerente'];
