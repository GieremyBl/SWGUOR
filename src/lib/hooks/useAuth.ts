'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { Usuario } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  const loadUserData = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error) throw error;
      setUser(data as Usuario);
    } catch (error) {
      console.error('[AUTH] Error loading user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        // Obtener sesión inicial
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Error obteniendo sesión inicial:', error);
          if (isMounted) setLoading(false);
          return;
        }

        if (session?.user && isMounted) {
          await loadUserData(session.user.id);
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('[AUTH] Error en inicialización de auth:', error);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de auth - usar solo UNA suscripción
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (!isMounted) return;
        
        console.log('[AUTH] Event:', event);
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Sin dependencias para que solo se ejecute una vez

  return { user, loading };
}