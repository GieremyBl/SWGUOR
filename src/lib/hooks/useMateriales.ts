'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchMateriales,
  fetchMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  ajustarStockMaterial,
} from '@/lib/helpers/materiales-helpers';
import { 
  type Material, 
  type MaterialCatalogo, 
  type MaterialFormValues, 
  type AjustarStockValues 
} from '@/lib/schemas/material';

export const MATERIALES_KEY = 'materiales';

// Tipado estricto para los parámetros de filtrado aceptados por el helper
export interface UseMaterialesParams {
  tipo?: string;
  busqueda?: string;
  stockBajo?: boolean;
}

// Interface genérica para respuestas estructuradas desde tus mutaciones de API
export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string | null;
  message?: string | null;
  data?: T;
  nuevoStock?: number;
}

// ── Hook: useMateriales ─────────────────────────────────────────────────────

export function useMateriales(params?: UseMaterialesParams) {
  const queryClient = useQueryClient();

  const query = useQuery<MaterialCatalogo[], Error>({
    queryKey: [MATERIALES_KEY, params],
    queryFn: () => fetchMateriales(params),
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation<ApiResponse<Material>, Error, MaterialFormValues>({
    mutationFn: createMaterial,
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? 'Error al crear material'); return; }
      toast.success('Material creado exitosamente');
      queryClient.invalidateQueries({ queryKey: [MATERIALES_KEY] });
    },
    onError: () => toast.error('Error de conexión con el servidor'),
  });

  const updateMutation = useMutation<ApiResponse<Material>, Error, { id: string; data: MaterialFormValues }>({
    mutationFn: ({ id, data }) => updateMaterial(id, data),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? 'Error al actualizar material'); return; }
      toast.success('Material actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: [MATERIALES_KEY] });
      queryClient.invalidateQueries({ queryKey: [MATERIALES_KEY, (res.data?.id)?.toString()] });
    },
    onError: () => toast.error('Error de conexión con el servidor'),
  });

  const ajustarStockMutation = useMutation<ApiResponse, Error, { id: string; data: Omit<AjustarStockValues, 'id'> }>({
    mutationFn: ({ id, data }) => ajustarStockMaterial(id, data),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? 'Error al ajustar stock'); return; }
      toast.success('Stock actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: [MATERIALES_KEY] });
    },
    onError: () => toast.error('Error de conexión con el servidor'),
  });

  const deleteMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: deleteMaterial,
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? 'Error al eliminar material'); return; }
      toast.success('Material eliminado permanentemente');
      queryClient.invalidateQueries({ queryKey: [MATERIALES_KEY] });
    },
    onError: () => toast.error('Error de conexión con el servidor'),
  });

  return {
    materiales: query.data ?? [],
    isLoading:  query.isLoading,
    refetch:    query.refetch,

    // Métodos expuestos con firmas exactas y auto-completado inteligente
    create:       (data: MaterialFormValues) => createMutation.mutate(data),
    update:       (id: string, data: MaterialFormValues) => updateMutation.mutate({ id, data }),
    ajustarStock: (id: string, data: Omit<AjustarStockValues, 'id'>) => ajustarStockMutation.mutate({ id, data }),
    remove:       (id: string) => deleteMutation.mutate(id),

    isCreating:       createMutation.isPending,
    isUpdating:       updateMutation.isPending,
    isAjustandoStock: ajustarStockMutation.isPending,
    isDeleting:       deleteMutation.isPending,
  };
}

// ── Hook: useMaterial (Detalle Individual) ──────────────────────────────────

export function useMaterial(id: string) {
  return useQuery<Material, Error>({
    queryKey: [MATERIALES_KEY, id],
    queryFn: () => fetchMaterialById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}