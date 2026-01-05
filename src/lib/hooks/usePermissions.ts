import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Usuario {
  id: string | number;
  nombre_completo: string;
  rol: string;
  estado: string;
}

interface Permissions {
  [key: string]: string[];
}

const ROLE_PERMISSIONS: { [key: string]: Permissions } = {
  admin: {
    usuarios: ['view', 'create', 'edit', 'delete'],
    clientes: ['view', 'create', 'edit', 'delete'],
    talleres: ['view', 'create', 'edit', 'delete'],
    pedidos: ['view', 'create', 'edit', 'delete'],
    inventario: ['view', 'create', 'edit', 'delete'],
    productos: ['view', 'create', 'edit', 'delete'],
    confecciones: ['view', 'create', 'edit', 'delete'],
    cotizaciones: ['view', 'create', 'edit', 'delete'],
    despachos: ['view', 'create', 'edit', 'delete'],
    pagos: ['view', 'create', 'edit', 'delete'],
    ventas: ['view', 'create', 'edit', 'delete'],
    reportes: ['view', 'export'],
    configuracion: ['view', 'edit'],
  },
  gerente: {
    usuarios: ['view'],
    clientes: ['view', 'create', 'edit'],
    talleres: ['view', 'create', 'edit'],
    pedidos: ['view', 'create', 'edit'],
    inventario: ['view'],
    productos: ['view'],
    confecciones: ['view', 'create', 'edit'],
    cotizaciones: ['view', 'create', 'edit'],
    despachos: ['view', 'create', 'edit'],
    pagos: ['view'],
    ventas: ['view'],
    reportes: ['view', 'export'],
  },
  supervisor: {
    clientes: ['view'],
    pedidos: ['view', 'edit'],
    inventario: ['view'],
    productos: ['view'],
    confecciones: ['view', 'edit'],
    despachos: ['view', 'edit'],
    ventas: ['view'],
  },
  usuario: {
    pedidos: ['view'],
    productos: ['view'],
    cotizaciones: ['view'],
  },
};

export function usePermissions() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permissions>({});

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      setIsLoading(true);

      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        console.warn('[usePermissions] No authenticated user found');
        setUsuario(null);
        setPermissions({});
        return;
      }

      console.log('[usePermissions] Auth user found:', authUser.id);

      // Reintentar obtener datos del usuario con backoff
      let userData = null;
      let error = null;
      const maxReintentos = 3;
      
      for (let intento = 0; intento < maxReintentos; intento++) {
        const resultado = await supabase
          .from('usuarios')
          .select('id, nombre_completo, rol, estado')
          .eq('auth_id', authUser.id)
          .single();

        error = resultado.error;
        userData = resultado.data;
        
        if (userData) {
          console.log('[usePermissions] User data found in attempt:', intento + 1);
          break;
        }
        
        if (intento < maxReintentos - 1) {
          console.warn('[usePermissions] User data not found, retrying in 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (error || !userData) {
        console.error('[usePermissions] Error fetching user permissions:', error);
        setUsuario(null);
        setPermissions({});
        return;
      }

      console.log('[usePermissions] User data retrieved:', { id: (userData as any).id, rol: (userData as any).rol });
      
      setUsuario(userData as Usuario);

      const userPermissions = ROLE_PERMISSIONS[(userData as any).rol?.toLowerCase()] || {};
      setPermissions(userPermissions);

    } catch (error) {
      console.error('[usePermissions] Unexpected error:', error);
      setUsuario(null);
      setPermissions({});
    } finally {
      setIsLoading(false);
    }
  };

  const can = (action: string, resource: string): boolean => {
    if (!usuario) return false;
    const resourcePermissions = permissions[resource] || [];
    return resourcePermissions.includes(action);
  };

  const cannot = (action: string, resource: string): boolean => {
    return !can(action, resource);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!usuario) return false;
    if (Array.isArray(role)) {
      return role.includes(usuario.rol?.toLowerCase() || '');
    }
    return usuario.rol?.toLowerCase() === role.toLowerCase();
  };

  return {
    usuario,
    isLoading,
    permissions,
    can,
    cannot,
    hasRole,
  };
}