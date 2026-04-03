import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client'; 
import { Personal } from '@/types';

interface AppPermissions {
  [resource: string]: string[];
}

const ROLE_PERMISSIONS: { [role: string]: AppPermissions } = {
  gerente: {
    usuarios: ['view', 'create', 'edit', 'delete', 'export'],
    categorias: ['view', 'create', 'edit', 'delete', 'export'],
    clientes: ['view', 'create', 'edit', 'delete', 'export'],
    productos: ['view', 'create', 'edit', 'delete', 'export'],
    pedidos: ['view', 'create', 'edit', 'delete', 'export'],
    inventario: ['view', 'create', 'edit', 'delete', 'export'],
    talleres: ['view', 'create', 'edit', 'delete', 'export'],
    ventas: ['view', 'create', 'edit', 'delete', 'export'],
    reportes: ['view', 'create', 'edit', 'delete', 'export'],
    configuracion: ['view', 'edit'],
  },
  administrador: {
    usuarios: ['view', 'create', 'edit', 'delete', 'export'],
    categorias: ['view', 'create', 'edit', 'delete', 'export'],
    clientes: ['view', 'create', 'edit', 'delete', 'export'],
    productos: ['view', 'create', 'edit', 'delete', 'export'],
    pedidos: ['view', 'export'],
    inventario: ['view', 'export'],
    talleres: ['view', 'create','export'],
    ventas: ['view', 'export'],
    reportes: ['view', 'export'],
    configuracion: ['view', 'edit'],
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
  disenador: {
    productos: ['view', 'create', 'edit'], 
    categorias: ['view', 'create', 'edit'],
    confecciones: ['view', 'create', 'edit'], 
    pedidos: ['view'],
    inventario: ['view'],
    reportes: ['view'],
  },
  cortador: {
    productos: ['view'], 
    confecciones: ['view', 'update_status'],
    inventario: ['view'],
    pedidos: ['view'],
  },
  ayudante: {
    productos: ['view'],
    confecciones: ['view'],
    despachos: ['view', 'update_status'],
    inventario: ['view'],
  },
};

export function usePermissions() {
  const [personal, setUsuario] = useState<Personal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<AppPermissions>({});

  const fetchUserPermissions = useCallback(async () => {

    const standardize = (text: string) => 
      text.toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""); // Elimina acentos y eñes
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: userData } = await supabase
        .from('personal')
        .select('id, nombre_completo, rol, estado')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (userData && standardize(userData.estado ?? '') === 'activo') {
        setUsuario(userData as Personal);
        
        // Aquí es donde ocurre la magia:
        const roleKey = standardize(userData.rol ?? '');
        console.log("Intentando cargar permisos para:", roleKey);
        
        // Si roleKey es "disenador", buscará en ROLE_PERMISSIONS.disenador
        setPermissions(ROLE_PERMISSIONS[roleKey] || {});
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Escuchamos cambios de sesión (login/logout) para actualizar permisos al instante
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
    if (!personal?.rol) return false;
    const currentRol = personal.rol.toLowerCase().trim();
    if (Array.isArray(roleName)) {
      return roleName.some(r => r.toLowerCase().trim() === currentRol);
    }
    return currentRol === roleName.toLowerCase().trim();
  }, [personal]);

  // Nueva utilidad rápida: isAdmin
  const isAdmin = useMemo(() => 
    personal?.rol?.toLowerCase().trim() === 'administrador', 
  [personal]);

  return useMemo(() => ({ 
    personal,
    role: personal?.rol?.toLowerCase().trim() || null,
    isAdmin,
    isLoading, 
    permissions, 
    can, 
    hasRole 
  }), [personal, isAdmin, isLoading, permissions, can, hasRole]);
}
