'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchProductos,
  fetchProductoById,
  createProducto,
  updateProducto,
  toggleEstadoProducto,
  deleteProducto,
} from '@/lib/helpers/productos-helpers';

export const PRODUCTOS_KEY = 'productos';

// Interfaces estrictas para las estructuras del modelo de negocio de productos
export interface Producto {
  id:          string;
  nombre:      string;
  sku?:        string | null;
  precio:      number;
  estado:      'activo' | 'inactivo';
  categoriaId?: string | null;
  [key: string]: unknown;
}

export interface CategoriaSimple {
  id:     string;
  nombre: string;
}

// Interfaz para el retorno específico de la función fetchProductos
interface ProductosQueryResponse {
  productos:  Producto[];
  categorias: CategoriaSimple[];
}

// Interfaz estricta para respuestas de mutación estándar
interface ApiResponse {
  success:  boolean;
  error?:   string | null;
  message?: string | null;
  data?:    unknown;
}

interface UseProductosParams {
  categoriaId?: string;
  estado?:      string;
  busqueda?:    string;
  color?:       string;
  talla?:       string;
  sortOrder?:   'asc' | 'desc' | 'none';
}

// ── Hook: useProductos ──────────────────────────────────────────────────────

export function useProductos(params?: UseProductosParams) {
  const queryClient = useQueryClient();

  const { categoriaId, estado, busqueda, color, talla, sortOrder } = params ?? {};

  const query = useQuery<ProductosQueryResponse, Error>({
    queryKey: [PRODUCTOS_KEY, { categoriaId, estado, busqueda, color, talla, sortOrder }], 
    queryFn:  async () => {
      const res = await fetchProductos({ categoriaId, estado, busqueda, color, talla, sortOrder });
      return res as unknown as ProductosQueryResponse;
    },
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation<ApiResponse, Error, Record<string, unknown>>({
    mutationFn: createProducto,
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? 'Error al crear'); return; }
      toast.success('Producto creado');
      queryClient.invalidateQueries({ queryKey: [PRODUCTOS_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const updateMutation = useMutation<ApiResponse, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => updateProducto(id, data),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? 'Error al actualizar'); return; }
      toast.success('Producto actualizado');
      queryClient.invalidateQueries({ queryKey: [PRODUCTOS_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const toggleMutation = useMutation<ApiResponse, Error, { id: string; estado: 'activo' | 'inactivo' }>({
    mutationFn: ({ id, estado }) => toggleEstadoProducto(id, estado),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? 'Error'); return; }
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: [PRODUCTOS_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const deleteMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: deleteProducto,
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? 'Error al eliminar'); return; }
      toast.success('Producto eliminado');
      queryClient.invalidateQueries({ queryKey: [PRODUCTOS_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    productos:  query.data?.productos  ?? [],
    categorias: query.data?.categorias ?? [],
    isLoading:  query.isLoading,
    refetch:    query.refetch,

    create:       (data: Record<string, unknown>) => createMutation.mutate(data),
    update:       (id: string, data: Record<string, unknown>) => updateMutation.mutate({ id, data }),
    toggleEstado: (id: string, estado: 'activo' | 'inactivo') => toggleMutation.mutate({ id, estado }),
    remove:       (id: string) => deleteMutation.mutate(id),

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isToggling: toggleMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ── Hook: useProducto (Individual) ──────────────────────────────────────────

export function useProducto(id: string) {
  return useQuery<Producto, Error>({
    queryKey: [PRODUCTOS_KEY, id],
    queryFn:  async () => {
      const res = await fetchProductoById(id);
      return res as unknown as Producto;
    },
    enabled:  !!id,
    refetchOnWindowFocus: false,
  });
}