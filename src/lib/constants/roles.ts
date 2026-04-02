/**
 * Constantes de Roles y Permisos
 * Define los roles de usuarios y sus permisos asociados
 */

import type { RolUsuario } from '@/types';

/**
 * Definición de permisos por rol
 */
export type PermissionKey =
  | 'ver_dashboard'
  | 'ver_ordenes'
  | 'crear_orden'
  | 'editar_orden'
  | 'eliminar_orden'
  | 'ver_pedidos'
  | 'crear_pedido'
  | 'editar_pedido'
  | 'cambiar_estado_pedido'
  | 'ver_inventario'
  | 'editar_inventario'
  | 'ver_productos'
  | 'crear_producto'
  | 'editar_producto'
  | 'eliminar_producto'
  | 'ver_clientes'
  | 'crear_cliente'
  | 'editar_cliente'
  | 'eliminar_cliente'
  | 'ver_usuarios'
  | 'crear_usuario'
  | 'editar_usuario'
  | 'eliminar_usuario'
  | 'ver_reportes'
  | 'ver_despachos'
  | 'crear_despacho'
  | 'editar_despacho'
  | 'ver_confecciones'
  | 'editar_confecciones'
  | 'ver_talleres'
  | 'crear_taller'
  | 'editar_taller'
  | 'ver_pagos'
  | 'registrar_pago'
  | 'ver_cotizaciones'
  | 'crear_cotizacion'
  | 'ver_configuracion'
  | 'editar_configuracion';

/**
 * Definición de roles con sus propiedades
 */
export const ROLES_INFO: Record<
  RolUsuario,
  {
    label: string;
    descripcion: string;
    color: string;
    nivel: number;
  }
> = {
  gerente: {
    label: 'Gerente General',
    descripcion: 'Acceso total al sistema',
    color: 'bg-red-100 text-red-800',
    nivel: 6
  },
  administrador: {
    label: 'Administrador',
    descripcion: 'Acceso total al sistema',
    color: 'bg-red-100 text-red-800',
    nivel: 5
  },
  cortador: {
    label: 'Cortador',
    descripcion: 'Responsable del corte de prendas',
    color: 'bg-orange-100 text-orange-800',
    nivel: 2
  },
  disenador: {
    label: 'Diseñador',
    descripcion: 'Responsable del diseño de prendas',
    color: 'bg-purple-100 text-purple-800',
    nivel: 2
  },
  recepcionista: {
    label: 'Recepcionista',
    descripcion: 'Maneja órdenes y clientes',
    color: 'bg-blue-100 text-blue-800',
    nivel: 3
  },
  ayudante: {
    label: 'Ayudante',
    descripcion: 'Asiste en tareas generales',
    color: 'bg-gray-100 text-gray-800',
    nivel: 1
  },
  representante_taller: {
    label: 'Representante de Taller',
    descripcion: 'Responsable de taller externo',
    color: 'bg-green-100 text-green-800',
    nivel: 2
  },

  cliente: {
    label: 'Cliente',
    descripcion: 'Acceso al portal de compras',
    color: 'bg-blue-50 text-blue-700',
    nivel: 0
  },

};

/**
 * Matriz de permisos por rol
 */
export const PERMISOS_POR_ROL: Record<RolUsuario, PermissionKey[]> = {
  gerente: [
    // Dashboard
    'ver_dashboard',
    // Órdenes
    'ver_ordenes',
    // Pedidos
    'ver_pedidos',
    // Inventario
    'ver_inventario',
    // Productos
    'ver_productos',
    // Clientes
    'ver_clientes',
    // Usuarios
    'ver_usuarios',
    // Reportes
    'ver_reportes',
    // Despachos
    'ver_despachos'
  ],

  administrador: [
    // Dashboard
    'ver_dashboard',
    // Órdenes
    'ver_ordenes',
    'crear_orden',
    'editar_orden',
    'eliminar_orden',
    // Pedidos
    'ver_pedidos',
    'crear_pedido',
    'editar_pedido',
    'cambiar_estado_pedido',
    // Inventario
    'ver_inventario',
    'editar_inventario',
    // Productos
    'ver_productos',
    'crear_producto',
    'editar_producto',
    'eliminar_producto',
    // Clientes
    'ver_clientes',
    'crear_cliente',
    'editar_cliente',
    'eliminar_cliente',
    // Usuarios
    'ver_usuarios',
    'crear_usuario',
    'editar_usuario',
    'eliminar_usuario',
    // Reportes
    'ver_reportes',
    // Despachos
    'ver_despachos',
    'crear_despacho',
    'editar_despacho',
    // Confecciones
    'ver_confecciones',
    'editar_confecciones',
    // Talleres
    'ver_talleres',
    'crear_taller',
    'editar_taller',
    // Pagos
    'ver_pagos',
    'registrar_pago',
    // Cotizaciones
    'ver_cotizaciones',
    'crear_cotizacion',
    // Configuración
    'ver_configuracion',
    'editar_configuracion'
  ],
  cortador: [
    'ver_dashboard',
    'ver_pedidos',
    'cambiar_estado_pedido',
    'ver_inventario'
  ],
  disenador: [
    'ver_dashboard',
    'ver_pedidos',
    'cambiar_estado_pedido',
    'ver_inventario',
    'ver_productos'
  ],
  recepcionista: [
    'ver_dashboard',
    'ver_ordenes',
    'crear_orden',
    'editar_orden',
    'ver_pedidos',
    'crear_pedido',
    'ver_inventario',
    'ver_productos',
    'ver_clientes',
    'crear_cliente',
    'editar_cliente',
    'ver_pagos',
    'registrar_pago',
    'ver_cotizaciones',
    'crear_cotizacion',
    'ver_despachos',
    'crear_despacho'
  ],
  ayudante: [
    'ver_dashboard',
    'ver_inventario',
    'ver_productos'
  ],
  representante_taller: [
    'ver_dashboard',
    'ver_pedidos',
    'cambiar_estado_pedido',
    'ver_confecciones',
    'editar_confecciones'
  ],
  
  cliente: [
    'ver_productos',
    'ver_pedidos',
    'crear_pedido'
  ],
};

/**
 * Función para verificar si un rol tiene un permiso
 */
export function tienePermiso(rol: RolUsuario, permiso: PermissionKey): boolean {
  return PERMISOS_POR_ROL[rol]?.includes(permiso) ?? false;
}

/**
 * Función para obtener el nivel de acceso de un rol
 */
export function getNivelAcceso(rol: RolUsuario): number {
  return ROLES_INFO[rol]?.nivel ?? 0;
}

/**
 * Función para verificar si un rol puede gestionar otro
 * (un usuario solo puede gestionar roles de menor nivel)
 */
export function puedeGestionarRol(rolUsuario: RolUsuario, rolAGestionar: RolUsuario): boolean {
  return getNivelAcceso(rolUsuario) > getNivelAcceso(rolAGestionar);
}

/**
 * Obtener etiqueta de rol
 */
export function getEtiquetaRol(rol: RolUsuario): string {
  return ROLES_INFO[rol]?.label || rol;
}

/**
 * Obtener lista de roles disponibles
 */
export const LISTA_ROLES = Object.keys(ROLES_INFO) as RolUsuario[];
