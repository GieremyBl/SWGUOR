'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchTalleres,
  createTaller,
  updateTaller,
  deactivateTaller,
  suspendTaller,
} from '@/lib/helpers/talleres-helpers';
import type { TallerForm } from '@/lib/schemas/talleres';

export const TALLERES_KEY = 'talleres';

export function useTalleres(params?: { search?: string; estado?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [TALLERES_KEY, params?.search ?? '', params?.estado ?? 'todos'],
    queryFn: () => fetchTalleres(params),
    refetchOnWindowFocus: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [TALLERES_KEY] });

  const createMutation = useMutation({
    mutationFn: createTaller,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al crear');
        return;
      }
      toast.success('Taller creado correctamente');
      invalidate();
    },
    onError: () => toast.error('Error de conexión'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TallerForm> }) =>
      updateTaller(id, data),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al actualizar');
        return;
      }
      toast.success('Taller actualizado correctamente');
      invalidate();
    },
    onError: () => toast.error('Error de conexión'),
  });

  const suspendMutation = useMutation({
    mutationFn: suspendTaller,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al suspender');
        return;
      }
      toast.success('Taller suspendido correctamente');
      invalidate();
    },
    onError: () => toast.error('Error de conexión'),
  });

  const deleteMutation = useMutation({
    mutationFn: deactivateTaller,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al desactivar');
        return;
      }
      toast.success(res.message || 'Taller desactivado correctamente');
      invalidate();
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    talleres: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,

    create: (data: TallerForm) => createMutation.mutateAsync(data),
    update: (id: string, data: Partial<TallerForm>) =>
      updateMutation.mutateAsync({ id, data }),
    suspend: (id: string) => suspendMutation.mutateAsync(id),
    remove: (id: string) => deleteMutation.mutateAsync(id),

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSuspending: suspendMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
