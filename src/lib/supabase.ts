import { createBrowserClient } from '@supabase/ssr';

// Cliente singleton para el navegador
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
}

// Helpers de autenticación
export async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('[SUPABASE] Error obteniendo usuario:', error);
    return null;
  }
  
  return user;
}

export async function getCurrentSession() {
  const supabase = getSupabaseBrowserClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('[SUPABASE] Error obteniendo sesión:', error);
    return null;
  }
  
  return session;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
}