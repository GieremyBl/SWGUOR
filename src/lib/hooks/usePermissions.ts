import { usePermissionsContext } from '@/components/providers/PermissionsProvider';
import {
  type RolUsuario,
  type PermisosRecurso,
  type AccionRecurso,
  type RecursoKey,
} from '@/lib/constants/roles';

export interface Usuario {
  id: number;
  email?: string;
  rol: RolUsuario;
  estado: string;
  auth_id?: string | null;
  ultimo_acceso?: string | null;
  created_at?: string;
}

export interface UsePermissionsReturn {
  usuario: Usuario | null;
  role: RolUsuario | null;
  isAdmin: boolean;
  isLoading: boolean;
  permissions: PermisosRecurso;
  can: (accion: AccionRecurso, recurso: RecursoKey) => boolean;
  hasRole: (rol: RolUsuario | RolUsuario[]) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const context = usePermissionsContext();

  // Si el contexto existe, usamos sus valores. 
  // Esto elimina el parpadeo de carga al navegar porque el estado ya viene del servidor.
  if (context) {
    return {
      usuario: context.usuario as Usuario | null,
      role: context.role,
      isAdmin: context.isAdmin,
      isLoading: context.isLoading,
      permissions: context.permissions,
      can: context.can,
      hasRole: context.hasRole,
    };
  }

  // Fallback seguro en caso de que el hook se use fuera del provider 
  // (aunque en la zona admin siempre debería estar disponible)
  return {
    usuario: null,
    role: null,
    isAdmin: false,
    isLoading: false,
    permissions: {},
    can: () => false,
    hasRole: () => false,
  };
}
