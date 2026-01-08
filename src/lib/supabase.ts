import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase');
}

// Cliente sin genéricos para evitar problemas de tipo
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? {
        getItem: (key) => {
          try {
            return window.localStorage?.getItem(key) ?? null;
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            window.localStorage?.setItem(key, value);
          } catch {
            // ignore
          }
        },
        removeItem: (key) => {
          try {
            window.localStorage?.removeItem(key);
          } catch {
            // ignore
          }
        },
      } : undefined,
    }
  }
);

// Funciones optimizadas
export const getCurrentUser = () => supabase.auth.getUser();
export const getCurrentSession = () => supabase.auth.getSession();
export const signIn = (email: string, password: string) => 
  supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();

// Helper para actualizar último acceso
export const updateLastAccess = async (userId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      console.error('Error actualizando último acceso:', error);
    }
  } catch (e) {
    console.error('Error inesperado actualizando último acceso:', e);
  }
};