import { supabase } from '@/lib/supabase/client';
import type { Personal, ClienteB2B } from '@/types';

/**
 * Obtiene los datos detallados de un personal
 * El ID de la tabla personal es numérico.
 */
export const getUsuarioData = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("personal")
      .select(`*`)
      .eq("id", Number(userId))
      .single();

    if (error) throw error;
    // Retornamos data casteado a personal para asegurar el tipado en el componente
    return { data: data as Personal, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

/**
 * Actualiza la información del perfil del personal
 */
export const updateUsuario = async (userId: string, updates: Partial<Personal>) => {
  try {
    const { data, error } = await supabase
      .from("personal")
      .update(updates)
      .eq("id", Number(userId))
      .select()
      .single();

    if (error) throw error;
    return { data: data as Personal, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

/**
 * Obtiene el perfil vinculado al Auth ID (UUID de Supabase)
 */
export const obtenerPerfilUsuario = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil, error } = await supabase
    .from('personal')
    .select('*')
    .eq('auth_id', user.id) // Buscamos por el UUID de la sesión
    .single();

  if (error) return null;
  return perfil as Personal;
};

/**
 * Vincula un personal de Auth con su entidad de Cliente B2B
 */
export const obtenerClienteAsociado = async (userId: string): Promise<ClienteB2B | null> => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('auth_id', userId) 
    .single();

  if (error || !data) return null;

  return data as ClienteB2B;
};