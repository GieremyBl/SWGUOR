"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import AdminSidebar from './Sidebar';
import AdminHeader from './Header';
import type { Personal } from '@/types';

export default function RealtimeLayoutWrapper({ 
  initialUsuario, 
  children 
}: { 
  initialUsuario: Personal, 
  children: React.ReactNode 
}) {
  const [personal, setUsuario] = useState<Personal>(initialUsuario);
  
  // Usamos ref para mantener la referencia del personal sin disparar efectos
  const usuarioRef = useRef(personal);

  useEffect(() => {
    // Actualizar la referencia cuando el estado cambie
    usuarioRef.current = personal;
  }, [personal]);

  useEffect(() => {
    // Suscripción a cambios en la tabla 'usuarios'
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
          const newUser = payload.new as Personal;
          
          // Comparación profunda básica para evitar actualizaciones innecesarias
          if (JSON.stringify(newUser) !== JSON.stringify(usuarioRef.current)) {
            setUsuario(newUser);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialUsuario.id, supabase]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar personal={personal} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader personal={personal} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}