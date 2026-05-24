"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { 
  RolUsuario, 
  RecursoKey, 
  AccionRecurso, 
  PermisosRecurso, 
  PERMISOS_RECURSO_POR_ROL 
} from '@/lib/constants/roles';

export interface PersonalInternoRelacion {
  nombre_completo: string | null;
}

export interface UsuarioContext {
  id: bigint;
  email: string;
  rol: string | null;
  estado: string | null;
  auth_id: string | null;
  ultimo_acceso: Date | null;
  created_at: Date | null;
  personal_interno: PersonalInternoRelacion[];
}

export interface PermissionsContextType {
  usuario: UsuarioContext | null;
  role: RolUsuario | null;
  isAdmin: boolean;
  isLoading: boolean;
  permissions: PermisosRecurso;
  can: (accion: AccionRecurso, recurso: RecursoKey) => boolean;
  hasRole: (rol: RolUsuario | RolUsuario[]) => boolean;
}

// Inicialización limpia sin utilizar "undefined"
const PermissionsContext = createContext<PermissionsContextType>({
  usuario: null,
  role: null,
  isAdmin: false,
  isLoading: false,
  permissions: {},
  can: () => false,
  hasRole: () => false,
});

export function PermissionsProvider({ 
  usuario, 
  isLoading = false,
  children 
}: { 
  usuario: UsuarioContext | null; 
  isLoading?: boolean;
  children: React.ReactNode 
}) {
  const role = useMemo(() => {
    if (!usuario?.rol) return null;
    return usuario.rol.toLowerCase() as RolUsuario;
  }, [usuario?.rol]);

  const isAdmin = useMemo(() => 
    role === 'administrador' || role === 'gerente',
  [role]);
  
  const permissions = useMemo(() => {
    if (!role) return {};
    return PERMISOS_RECURSO_POR_ROL[role] || {};
  }, [role]);

  const can = (accion: AccionRecurso, recurso: RecursoKey): boolean => {
    return permissions[recurso]?.includes(accion) ?? false;
  };

  const hasRole = (rol: RolUsuario | RolUsuario[]): boolean => {
    if (!role) return false;
    return Array.isArray(rol) ? rol.includes(role) : role === rol;
  };

  const value = useMemo(() => ({
    usuario,
    role,
    isAdmin,
    isLoading,
    permissions,
    can,
    hasRole
  }), [usuario, role, isAdmin, isLoading, permissions]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  return useContext(PermissionsContext);
}