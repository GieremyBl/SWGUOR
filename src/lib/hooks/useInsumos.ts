'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchInsumosCompras,
  fetchInsumoDetalle,
  createInsumoCompras,
  updateInsumoCompras,
  type ListarInsumosParams,
} from '@/lib/helpers/insumos-helpers';

export const INSUMOS_KEY = 'insumos_compras';

export function useInsumos(params?: ListarInsumosParams) {
  const queryClient = useQueryClient();
  const { tipo, categoriaId, busqueda, stockBajo, proveedorId, sortOrder } = params ?? {};

  const query = useQuery({
    queryKey: [INSUMOS_KEY, { tipo, categoriaId, busqueda, stockBajo, proveedorId, sortOrder }],
    queryFn: () => fetchInsumosCompras({ tipo, categoriaId, busqueda, stockBajo, proveedorId, sortOrder }),
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: createInsumoCompras,
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? 'Error al crear'); return; }
      toast.success('Insumo registrado');
      queryClient.invalidateQueries({ queryKey: [INSUMOS_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateInsumoCompras(id, data),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? 'Error al actualizar'); return; }
      toast.success('Insumo actualizado');
      queryClient.invalidateQueries({ queryKey: [INSUMOS_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    insumos: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    create: (data: Record<string, unknown>) => createMutation.mutateAsync(data),
    update: (id: string, data: Record<string, unknown>) =>
      updateMutation.mutateAsync({ id, data }),
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
}

export function useInsumoDetalle(id: string) {
  return useQuery({
    queryKey: [INSUMOS_KEY, id],
    queryFn: () => fetchInsumoDetalle(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}
