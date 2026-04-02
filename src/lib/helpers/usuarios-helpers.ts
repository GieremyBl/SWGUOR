import { createClient } from '@/lib/supabase/client/client';
import { supabase } from '@/lib/supabase/client';
import type { Usuario, ClienteB2B } from '@/types';

/**
 * Obtiene los datos detallados de un usuario para el panel administrativo
 */
export const getUsuarioData = async (userId: string) => {
  const supabase = supabase();

  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id,
        nombre_completo,
        email,
        telefono,
        avatar_url,
        rol,
        estado,
        created_at,
        ultimo_acceso
      `)
      .eq("id", userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error en getUsuarioData:", error.message);
    return { data: null, error };
  }
};

/**
 * Actualiza la información del perfil del usuario (nombre, teléfono, avatar)
 */
export const updateUsuario = async (userId: string, updates: Partial<Usuario>) => {
  const supabase = supabase();

  try {
    const { data, error } = await (supabase.from("usuarios") as any)
      .from("usuarios")
      .update(updates as any)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error en updateUsuario:", error.message);
    return { data: null, error };
  }
};

/**
 * Función auxiliar para subir el avatar al bucket de storage
 * (Útil si quieres centralizar la lógica de carga de imágenes)
 */
export const uploadAvatar = async (userId: string, file: File) => {
  const supabase = supabase();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  try {
    // 1. Subir imagen
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 3. Actualizar tabla usuarios
    await updateUsuario(userId, { avatar_url: publicUrl });

    return { publicUrl, error: null };
  } catch (error: any) {
    return { publicUrl: null, error };
  }
};

/**
 * Obtiene el perfil del usuario actual desde la sesión de Supabase
 */
export const obtenerPerfilUsuario = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single();

  return perfil as Usuario;
};

/**
 * Vincula un usuario de Auth con su entidad de Cliente B2B
 */
export const obtenerClienteAsociado = async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('clientes')
    .select('*')
    .eq('auth_id', userId) // Usando el campo auth_id que vimos en tu Prisma
    .single();

  return data as ClienteB2B;
};