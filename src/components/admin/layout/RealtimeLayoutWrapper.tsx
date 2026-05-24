"use client";

import { useEffect, useState, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import AdminSidebar from './Sidebar';
import AdminHeader from './Header';
import type { usuarios } from '@prisma/client';
import { PermissionsProvider, UsuarioContext, PersonalInternoRelacion } from '@/components/providers/PermissionsProvider';

export interface UsuarioConPersonal extends usuarios {
  personal_interno: PersonalInternoRelacion[];
}

export default function RealtimeLayoutWrapper({ 
  initialUsuario, 
  children 
}: { 
  initialUsuario: UsuarioConPersonal, 
  children: React.ReactNode 
}) {
  const [usuario, setUsuario] = useState<UsuarioConPersonal>(initialUsuario);
  const supabase = getSupabaseBrowserClient();
  
  const usuarioRef = useRef<UsuarioConPersonal>(usuario);

  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  useEffect(() => {
    const channel = supabase
      .channel(`user-changes-${initialUsuario.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usuarios',
          filter: `id=eq.${initialUsuario.id}`,
        },
        (payload) => {
          const newUser = payload.new as usuarios;
          
          if (JSON.stringify(newUser) !== JSON.stringify(usuarioRef.current)) {
            setUsuario((prev) => ({
              ...prev,
              ...newUser
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialUsuario.id, supabase]);

  // Conversión formal sin aserciones forzadas (Mapeo estricto campo a campo)
  const usuarioContextFormateado: UsuarioContext = {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    estado: usuario.estado,
    auth_id: usuario.auth_id,
    ultimo_acceso: usuario.ultimo_acceso,
    created_at: usuario.created_at,
    personal_interno: usuario.personal_interno,
  };

  return (
    <PermissionsProvider usuario={usuarioContextFormateado}>
      <div className="admin-shell flex h-screen overflow-hidden bg-slate-50">
        <AdminSidebar usuario={usuario} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader usuario={usuario} />
          <main className="admin-content flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}