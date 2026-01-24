import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase'; 
import { Usuario } from '@/types/supabase.types';

// 1. Definimos nuestra propia interfaz para evitar conflictos con la de TS
interface AppPermissions {
  [resource: string]: string[]; // Esto permite usar 'usuarios', 'productos', etc.
}

const ROLE_PERMISSIONS: { [role: string]: AppPermissions } = {
  administrador: {
    usuarios: ['view', 'create', 'edit', 'delete'],
    clientes: ['view', 'export'],
    productos: ['view', 'export'],
    pedidos: ['view', 'export'],
    inventario: ['view', 'export'],
    talleres: ['view', 'create','export'],
    reportes: ['view', 'export'],
  },
 representante_taller: {
    productos: ['view'],
    talleres: ['view', 'edit'],
    confecciones: ['view', 'create', 'edit'],
    inventario: ['view', 'edit'],
  },
  recepcionista: {
    productos: ['view', 'export'],
    clientes: ['view', 'create', 'edit'],
    pedidos: ['view', 'create', 'edit'],
    pagos: ['view', 'create'],
    cotizaciones: ['view', 'create'],
  },
  diseñador: {
    productos: ['view'], 
    confecciones: ['view', 'create', 'edit'], 
    pedidos: ['view'],
  },
  cortador: {
    productos: ['view'], 
    confecciones: ['view', 'update_status'],
    pedidos: ['view'],
  },
  ayudante: {
    productos: ['view'],
    confecciones: ['view'],
    despachos: ['view', 'update_status'],
  },
};

export function usePermissions() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<AppPermissions>({});

  // 1. Memorizamos la carga de datos para que no se dispare mil veces
  const fetchUserPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setUsuario(null);
        setPermissions({});
        return;
      }

      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('id, nombre_completo, rol, estado')
        .eq('auth_id', authUser.id)
        .single();

      if (error || !userData) {
        setUsuario(null);
        setPermissions({});
        return;
      }

      setUsuario(userData as Usuario);
      const roleKey = (userData as any).rol?.toLowerCase() || '';
      setPermissions(ROLE_PERMISSIONS[roleKey] || {});

    } catch (error) {
      console.error("Error permissions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  // 2. can debe estar envuelto en useCallback
  const can = useCallback((action: string, resource: string): boolean => {
    if (!usuario) return false;
    const resourcePermissions = permissions[resource] || [];
    return resourcePermissions.includes(action);
  }, [usuario, permissions]);

  const cannot = useCallback((action: string, resource: string): boolean => !can(action, resource), [can]);

  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!usuario) return false;
    const currentRol = usuario.rol?.toLowerCase() || '';
    if (Array.isArray(role)) {
      return role.some(r => r.toLowerCase() === currentRol);
    }
    return currentRol === role.toLowerCase();
  }, [usuario]);

  // 3. Retornamos valores estables
  return useMemo(() => ({ 
    usuario, 
    isLoading, 
    permissions, 
    can, 
    cannot, 
    hasRole 
  }), [usuario, isLoading, permissions, can, cannot, hasRole]);
}