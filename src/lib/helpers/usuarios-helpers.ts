import { createClient } from '@/lib/supabase/client';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Usuario = Database['public']['Tables']['usuarios']['Row'];
type ClienteB2B = Database['public']['Tables']['clientes']['Row'];
type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

export const getUsuarioData = async (userId: string) => {
  const supabase = getSupabaseBrowserClient();
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id,
        nombre_completo,
        email,
        telefono,
        rol,
        estado,
        created_at,
        ultimo_acceso
      `) 
      .eq("auth_id", userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error en getUsuarioData:", error.message);
    return { data: null, error };
  }
};

export const updateUsuario = async (
  userId: string, 
  updates: TablesUpdate<'usuarios'> 
) => {
  const supabase = getSupabaseBrowserClient();
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .update(updates)
      .eq("auth_id", userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error en updateUsuario:", error.message);
    return { data: null, error };
  }
};

export const obtenerPerfilUsuario = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  return perfil as unknown as Usuario;
};

export const obtenerClienteAsociado = async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('clientes')
    .select('*')
    .eq('auth_id', userId)
    .single();

  return data as unknown as ClienteB2B;
};