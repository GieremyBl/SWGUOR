import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { Producto } from '@/types';

interface UseProductsOptions {
  categoriaId?: number;
  estado?: 'activo' | 'inactivo' | 'agotado';
  busqueda?: string;
}

export function useProducts(options?: UseProductsOptions) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductos();
  }, [options?.categoriaId, options?.estado, options?.busqueda]);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();

      // Seleccionar todos los campos (podría optimizarse)
      let query = supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (options?.categoriaId) {
        query = query.eq('categoria_id', options.categoriaId);
      }
      if (options?.estado) {
        query = query.eq('estado', options.estado);
      }
      if (options?.busqueda) {
        query = query.or(`nombre.ilike.%${options.busqueda}%,sku.ilike.%${options.busqueda}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // MAPEO CRÍTICO: Traducimos los datos de la BD a lo que espera la tabla
      const productosFormateados = data?.map((p: any) => ({
        ...p,
        // Si existe p.precio lo usa, si no, usa p.precio_base
        precio: p.precio ?? p.precio ?? 0,
        // Lo mismo para el stock y la imagen
        stock: p.stock ?? p.stock ?? 0,
        imagen: p.imagen ?? p.imagen ?? null,
      })) || [];

      setProductos(productosFormateados);
    } catch (err) {
      console.error('Error fetching productos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return { productos, loading, error, refetch: fetchProductos };
}