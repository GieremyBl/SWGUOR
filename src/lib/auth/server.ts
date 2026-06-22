import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { RolUsuario, EstadoUsuario, PermissionKey } from '@/lib/constants/roles';
import { LISTA_ROLES, tienePermiso } from '@/lib/constants/roles';

export type ServerAuthUser = {
  authId: string;
  id: number;
  rol: RolUsuario;
  estado: EstadoUsuario;
  email?: string | null;
  nombre_completo?: string | null;
};

export type AuthErrorCode =
  | 'unauthenticated'
  | 'usuario_no_encontrado'
  | 'usuario_inactivo'
  | 'sin_permisos';

export type AuthCheckResult =
  | { success: true; user: ServerAuthUser }
  | { success: false; error: AuthErrorCode; status: 401 | 403 | 404 };

function normalizeRole(rawRole: string | null | undefined): RolUsuario | null {
  const normalized = rawRole?.toLowerCase().trim();
  if (!normalized || !LISTA_ROLES.includes(normalized as RolUsuario)) {
    return null;
  }
  return normalized as RolUsuario;
}

function normalizeEstado(rawEstado: string | null | undefined): EstadoUsuario {
  return (rawEstado?.toLowerCase().trim() ?? 'inactivo') as EstadoUsuario;
}

export async function getServerAuthUser(): Promise<AuthCheckResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('[Auth Server] Error getting auth user:', error);
  }

  if (!user) {
    return { success: false, error: 'unauthenticated', status: 401 };
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { auth_id: user.id },
    select: {
      id: true,
      auth_id: true,
      rol: true,
      estado: true,
      email: true,
    },
  });

  if (!usuario) {
    return { success: false, error: 'usuario_no_encontrado', status: 404 };
  }

  if (!usuario.auth_id) {
    console.warn(`Usuario ${usuario.id} no tiene auth_id en la base de datos`);
    return { success: false, error: 'sin_permisos', status: 403 };
  }

  const rol = normalizeRole(usuario.rol);
  if (!rol) {
    console.warn(`Usuario ${usuario.id} tiene rol inválido: ${usuario.rol}`);
    return { success: false, error: 'sin_permisos', status: 403 };
  }

  const estado = normalizeEstado(usuario.estado);
  if (estado !== 'activo') {
    return { success: false, error: 'usuario_inactivo', status: 403 };
  }

  return {
    success: true,
    user: {
      authId: usuario.auth_id,
      id: Number(usuario.id),
      rol,
      estado,
      email: usuario.email,
    },
  };
}

export async function requireServerAuth(): Promise<AuthCheckResult> {
  return getServerAuthUser();
}

export async function requireServerRole(allowedRoles: RolUsuario[]): Promise<AuthCheckResult> {
  const auth = await getServerAuthUser();
  if (!auth.success) {
    return auth;
  }

  const normalizedAllowed = allowedRoles.map((rol) => rol.toLowerCase().trim() as RolUsuario);
  if (!normalizedAllowed.includes(auth.user.rol)) {
    return { success: false, error: 'sin_permisos', status: 403 };
  }

  return auth;
}

export async function requireServerPermission(
  permission: PermissionKey,
): Promise<AuthCheckResult> {
  const auth = await getServerAuthUser();
  if (!auth.success) {
    return auth;
  }

  if (!tienePermiso(auth.user.rol, permission)) {
    return { success: false, error: 'sin_permisos', status: 403 };
  }

  return auth;
}

export async function requireAdmin(): Promise<AuthCheckResult> {
  return requireServerRole(['administrador', 'gerente']);
}

export type OwnershipCheckResult =
  | { success: true }
  | { success: false; error: 'sin_permisos'; status: 403 };

export function validateResourceOwnership(
  currentUserId: number,
  resourceOwnerId: number,
): OwnershipCheckResult {
  if (currentUserId !== resourceOwnerId) {
    return { success: false, error: 'sin_permisos', status: 403 };
  }
  return { success: true };
}
