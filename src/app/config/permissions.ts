/**
 * Configuración de Permisos del Sistema
 * Re-utiliza la definición centralizada de roles.ts
 */

import type { RolUsuario, PermissionKey } from '@/types/auth';
import { PERMISOS_POR_ROL, tienePermiso } from '@/types/auth';

// Re-exportar para compatibilidad
export const rolePermissions: Record<RolUsuario, PermissionKey[]> = PERMISOS_POR_ROL;

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(userRole: RolUsuario, permission: PermissionKey): boolean {
  return tienePermiso(userRole, permission);
}

/**
 * Verifica si un rol tiene al menos uno de los permisos
 */
export function hasAnyPermission(userRole: RolUsuario, permissions: PermissionKey[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Verifica si un rol tiene todos los permisos
 */
export function hasAllPermissions(userRole: RolUsuario, permissions: PermissionKey[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}