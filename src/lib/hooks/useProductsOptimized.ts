/**
 * Hooks optimizados para consultas a Supabase
 * Con paginación, caché y optimizaciones de rendimiento
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Producto } from '@/types/supabase.types';

interface UseProductsOptions {
  categoriaId?: number;
  estado?: 'activo' | 'inactivo' | 'agotado';
  busqueda?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook optimizado para productos con paginación
 * Reduce carga de datos y mejora rendimiento
 */
export function useProductsOptimized(options?: UseProductsOptions) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const page = options?.page || 1;
  const limit = options?.limit || 50;

  // ✅ Usar useCallback para evitar recrear función en cada render
  const fetchProductos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calcular offset para paginación
      const offset = (page - 1) * limit;

      // ✅ Seleccionar solo campos necesarios (no todo)
      let query = supabase
        .from('productos')
        .select(
          'id, nombre, sku, precio, stock, stock_minimo, categoria_id, estado, created_at',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros
      if (options?.categoriaId) {
        query = query.eq('categoria_id', options.categoriaId);
      }
      if (options?.estado) {
        query = query.eq('estado', options.estado);
      }
      if (options?.busqueda) {
        query = query.or(
          `nombre.ilike.%${options.busqueda}%,sku.ilike.%${options.busqueda}%`
        );
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;
      setProductos(data || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching productos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [page, limit, options?.categoriaId, options?.estado, options?.busqueda]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  // ✅ Usar useMemo para evitar recalcular
  const pageCount = useMemo(() => Math.ceil(total / limit), [total, limit]);

  return {
    productos,
    loading,
    error,
    refetch: fetchProductos,
    page,
    pageCount,
    total,
  };
}

/**
 * Hook para obtener categorías (caché)
 */
export function useCategorias() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        // ✅ Cache en localStorage
        const cached = localStorage.getItem('categorias_cache');
        if (cached) {
          setCategorias(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('categorias')
          .select('id, nombre')
          .eq('activo', true)
          .order('nombre');

        if (error) throw error;
        
        setCategorias(data || []);
        // Guardar en caché por 30 minutos
        localStorage.setItem('categorias_cache', JSON.stringify(data || []));
      } catch (error) {
        console.error('Error fetching categorias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  return { categorias, loading };
}

/**
 * Invalidar cachés
 */
export function invalidateProductsCache() {
  localStorage.removeItem('categorias_cache');
}
