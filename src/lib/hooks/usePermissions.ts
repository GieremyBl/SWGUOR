import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

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
        console.error('Error fetching user permissions:', error);
        setUsuario(null);
        setPermissions({});
        return;
      }

      setUsuario(userData as Usuario);

      const userPermissions = ROLE_PERMISSIONS[(userData as any).rol?.toLowerCase()] || {};
      setPermissions(userPermissions);

    } catch (error) {
      console.error('Error in usePermissions:', error);
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