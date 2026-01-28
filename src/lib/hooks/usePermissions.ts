
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase'; 
import { Usuario } from '@/types/supabase.types';

interface AppPermissions {
  [resource: string]: string[];
}

const ROLE_PERMISSIONS: { [role: string]: AppPermissions } = {
  administrador: {
    usuarios: ['view', 'create', 'edit', 'delete', 'export'],
    clientes: ['view', 'export'],
    productos: ['view', 'create', 'edit', 'delete', 'export'],
    pedidos: ['view', 'export'],
    inventario: ['view', 'export'],
    talleres: ['view', 'create','export'],
    ventas: ['view', 'export'],
    reportes: ['view', 'export'],
  },
  representante_taller: {
    productos: ['view', 'export'], 
    talleres: ['view', 'edit'],
    confecciones: ['view', 'create', 'edit'],
    inventario: ['view', 'edit', 'export'], 
  },
  recepcionista: {
    productos: ['view', 'export'],
    clientes: ['view', 'create', 'edit'],
    pedidos: ['view', 'create', 'edit'],
    pagos: ['view', 'create'],
    cotizaciones: ['view', 'create'],
  },
  diseñador: {
    productos: ['view', 'create', 'edit'], 
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

  const fetchUserPermissions = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    
    try {
      // getSession es mucho más rápido que getUser porque usa la caché local
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
        .maybeSingle();

      if (error || !userData || userData.estado?.toLowerCase() !== 'activo') {
        setUsuario(null);
        setPermissions({});
        return;
      }

      setUsuario(userData as Usuario);
      // Normalizamos el rol para evitar errores de tildes o mayúsculas
      const roleKey = userData.rol?.toLowerCase().trim() || '';
      setPermissions(ROLE_PERMISSIONS[roleKey] || {});

    } catch (error) {
      console.error("Error en sincronización de permisos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Escuchamos cambios de sesión (login/logout) para actualizar permisos al instante
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserPermissions();
    });

    fetchUserPermissions();
    return () => subscription.unsubscribe();
  }, [fetchUserPermissions]);

  // Funciones de validación memorizadas
  const can = useCallback((action: string, resource: string): boolean => {
    const resourcePermissions = permissions[resource] || [];
    return resourcePermissions.includes(action);
  }, [permissions]);

  const hasRole = useCallback((roleName: string | string[]): boolean => {
    if (!usuario?.rol) return false;
    const currentRol = usuario.rol.toLowerCase().trim();
    if (Array.isArray(roleName)) {
      return roleName.some(r => r.toLowerCase().trim() === currentRol);
    }
    return currentRol === roleName.toLowerCase().trim();
  }, [usuario]);

  // Nueva utilidad rápida: isAdmin
  const isAdmin = useMemo(() => 
    usuario?.rol?.toLowerCase().trim() === 'administrador', 
  [usuario]);

  return useMemo(() => ({ 
    usuario,
    role: usuario?.rol?.toLowerCase().trim() || null,
    isAdmin,
    isLoading, 
    permissions, 
    can, 
    hasRole 
  }), [usuario, isAdmin, isLoading, permissions, can, hasRole]);
}