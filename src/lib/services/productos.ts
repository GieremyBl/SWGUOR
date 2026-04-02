import { supabase} from "@/lib/supabase/client/client";

export async function getProductos() {
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

export async function searchProductos(query: string) {
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