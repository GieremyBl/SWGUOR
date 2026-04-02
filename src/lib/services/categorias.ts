import { supabase } from "@/lib/supabase/client/client";

export async function getCategorias() {
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