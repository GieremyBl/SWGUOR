import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  type RolUsuario,
  type EstadoUsuario,
  type PermisosRecurso,
  type AccionRecurso,
  PERMISOS_RECURSO_POR_ROL,
} from '@/lib/constants/roles';

export interface Usuario {
  id: number;
  nombre_completo: string;
  email?: string;
  telefono?: string | null;
  rol: RolUsuario;
  estado: EstadoUsuario;
  auth_id?: string | null;
  ultimo_acceso?: string | null;
  created_at?: string;
}

export function usePermissions() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<PermisosRecurso>({});

  const fetchUserPermissions = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();

    const normalizar = (text: string) =>
      text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setUsuario(null);
        setPermissions({});
        return;
      }

      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('id, nombre_completo, rol, estado')
        .eq('auth_id', session.user.id)
        .maybeSingle<Pick<Usuario, 'id' | 'nombre_completo' | 'rol' | 'estado'>>();

      if (error || !userData || normalizar(userData.estado) !== 'activo') {
        setUsuario(null);
        setPermissions({});
        return;
      }

      setUsuario(userData as Usuario);

      // Normalizar el rol para que coincida con las claves del mapa
      // ("diseñador" en BD → "disenador" en el mapa, etc.)
      const rolKey = normalizar(userData.rol) as RolUsuario;
      setPermissions(PERMISOS_RECURSO_POR_ROL[rolKey] ?? {});

    } catch (err) {
      console.error('Error en sincronización de permisos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserPermissions();
    });

    fetchUserPermissions();
    return () => subscription.unsubscribe();
  }, [fetchUserPermissions]);

  /** Verifica si el rol actual puede ejecutar `accion` sobre `recurso` */
  const can = useCallback(
    (accion: AccionRecurso, recurso: string): boolean =>
      permissions[recurso]?.includes(accion) ?? false,
    [permissions],
  );

  /** Verifica si el usuario tiene uno o varios roles */
  const hasRole = useCallback(
    (rol: RolUsuario | RolUsuario[]): boolean => {
      if (!usuario?.rol) return false;
      const actual = usuario.rol.toLowerCase().trim();
      return Array.isArray(rol)
        ? rol.some(r => r.toLowerCase().trim() === actual)
        : actual === rol.toLowerCase().trim();
    },
    [usuario],
  );

  const isAdmin = useMemo(
    () => ['administrador', 'gerente_general'].includes(usuario?.rol?.toLowerCase().trim() ?? ''),
    [usuario],
  );

  return useMemo(
    () => ({ usuario, role: usuario?.rol ?? null, isAdmin, isLoading, permissions, can, hasRole }),
    [usuario, isAdmin, isLoading, permissions, can, hasRole],
  );
}