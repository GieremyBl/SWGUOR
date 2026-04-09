/**
 * Tipos y Enums del Sistema
 * Re-exporta desde la fuente única de verdad: @/lib/constants/roles
 */

export {
  type RolUsuario,
  type EstadoUsuario,
  type PermissionKey,
  type PermisosRecurso,
  type AccionRecurso,
  PERMISOS_POR_ROL,
  PERMISOS_RECURSO_POR_ROL,
  ROLES_INFO,
  ROLE_LABELS,
  ROLE_COLORS,
  ESTADO_LABELS,
  ESTADO_COLORS,
  LISTA_ROLES,
  tienePermiso,
  getNivelAcceso,
  puedeGestionarRol,
  getEtiquetaRol,
} from '@/lib/constants/roles';

// ─────────────────────────────────────────────
// Enums de compatibilidad (para código existente que los importe)
// ─────────────────────────────────────────────

export enum Role {
  GERENTE_GENERAL      = 'gerente_general',
  ADMINISTRADOR        = 'administrador',
  RECEPCIONISTA        = 'recepcionista',
  DISENADOR            = 'disenador',
  CORTADOR             = 'cortador',
  AYUDANTE             = 'ayudante',
  REPRESENTANTE_TALLER = 'representante_taller',
  CLIENTE              = 'cliente',
}

export enum EstadoUsuarioEnum {
  ACTIVO     = 'activo',
  INACTIVO   = 'inactivo',
  SUSPENDIDO = 'suspendido',
}

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface Usuario {
  id: number;
  nombre_completo: string;
  email: string;
  telefono?: string | null;
  rol: Role;
  estado: EstadoUsuarioEnum;
  auth_id?: string | null;
  ultimo_acceso?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Session {
  user: Usuario;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// ─────────────────────────────────────────────
// Helpers (wrappers sobre los de roles.ts)
// ─────────────────────────────────────────────

import { tienePermiso, type PermissionKey } from '@/lib/constants/roles';

export function hasPermission(user: Usuario, permission: PermissionKey): boolean {
  return tienePermiso(user.rol as import('@/lib/constants/roles').RolUsuario, permission);
}

export function hasAnyPermission(user: Usuario, permissions: PermissionKey[]): boolean {
  return permissions.some(p => hasPermission(user, p));
}

export function hasAllPermissions(user: Usuario, permissions: PermissionKey[]): boolean {
  return permissions.every(p => hasPermission(user, p));
}

export function hasRole(user: Usuario, role: Role): boolean {
  return user.rol === role;
}

export function isAdmin(user: Usuario): boolean {
  return user.rol === Role.ADMINISTRADOR || user.rol === Role.GERENTE_GENERAL;
}

export function isUserActive(user: Usuario): boolean {
  return user.estado === EstadoUsuarioEnum.ACTIVO;
}