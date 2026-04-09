import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database'; 

// Cliente singleton para el navegador con tipos integrados
export type SupabaseClientTyped = ReturnType<typeof createBrowserClient<Database>>;

let supabaseClient: SupabaseClientTyped | null = null;

export function getSupabaseBrowserClient(): SupabaseClientTyped {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
}

// --- Tus helpers de autenticación se mantienen igual ---

export async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('[SUPABASE] Error obteniendo usuario:', error);
    return null;
  }
  
  return user;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Helpers para Productos
export async function getProductos() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[SUPABASE] Error obteniendo productos:', error);
    return [];
  }
  
  return data || [];
}

export async function getProductosPorCategoria(categoriaId: number) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('categoria_id', categoriaId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[SUPABASE] Error obteniendo productos por categoría:', error);
    return [];
  }
  
  return data || [];
}

export async function getProductoporId(id: number) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('[SUPABASE] Error obteniendo producto:', error);
    return null;
  }
  
  return data;
}

export async function buscarProductos(query: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .or(`nombre.ilike.%${query}%,descripcion.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[SUPABASE] Error buscando productos:', error);
    return [];
  }
  
  return data || [];
}

// Helpers para Categorías
export async function getCategorias() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });
  
  if (error) {
    console.error('[SUPABASE] Error obteniendo categorías:', error);
    return [];
  }
  
  return data || [];
}

export async function getCategoriasConProductos() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('*, productos(count)')
    .eq('activo', true)
    .order('nombre', { ascending: true });
  
  if (error) {
    console.error('[SUPABASE] Error obteniendo categorías:', error);
    return [];
  }
  
  return data || [];
}

export async function getCategoriaPorId(id: number) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('[SUPABASE] Error obteniendo categoría:', error);
    return null;
  }
  
  return data;
}