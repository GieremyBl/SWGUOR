'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchFichaMedidas,
  saveFichaMedidasBulk,
  agregarFichaMedida,
  actualizarFichaMedida,
  deleteFichaMedida,
  type FichaMedidaPayload,
} from '@/lib/helpers/ficha-medidas-helpers';
import type { FichaMedidaRow } from '@/lib/schemas/ficha-medidas';

export const FICHA_MEDIDAS_KEY = 'ficha-medidas';
const FICHA_TECNICA_KEY = 'ficha-tecnica-detalle';

interface ApiResponse {
  success: boolean;
  error?: string | null;
}

function invalidateMedidasQueries(queryClient: ReturnType<typeof useQueryClient>, ficha_id: string) {
  queryClient.invalidateQueries({ queryKey: [FICHA_MEDIDAS_KEY, ficha_id] });
  queryClient.invalidateQueries({ queryKey: [FICHA_TECNICA_KEY, ficha_id] });
}

export function useFichaMedidas(ficha_id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [FICHA_MEDIDAS_KEY, ficha_id],
    queryFn: () => fetchFichaMedidas(ficha_id),
    enabled: !!ficha_id,
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation<ApiResponse, Error, FichaMedidaPayload[]>({
    mutationFn: (medidas) => saveFichaMedidasBulk(ficha_id, medidas),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al guardar medidas');
        return;
      }
      toast.success('Medidas guardadas');
      invalidateMedidasQueries(queryClient, ficha_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const addMutation = useMutation<ApiResponse, Error, FichaMedidaPayload>({
    mutationFn: (medida) => agregarFichaMedida(ficha_id, medida),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al agregar medida');
        return;
      }
      toast.success('Medida agregada');
      invalidateMedidasQueries(queryClient, ficha_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const updateMutation = useMutation<
    ApiResponse,
    Error,
    { id: string; data: Partial<FichaMedidaPayload> }
  >({
    mutationFn: ({ id, data }) => actualizarFichaMedida(id, data),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al actualizar medida');
        return;
      }
      toast.success('Medida actualizada');
      invalidateMedidasQueries(queryClient, ficha_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const deleteMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: deleteFichaMedida,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al eliminar medida');
        return;
      }
      toast.success('Medida eliminada');
      invalidateMedidasQueries(queryClient, ficha_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    medidas: (query.data ?? []) as FichaMedidaRow[],
    isLoading: query.isLoading,
    refetch: query.refetch,

    save: (medidas: FichaMedidaPayload[]) => saveMutation.mutateAsync(medidas),
    add: (medida: FichaMedidaPayload) => addMutation.mutateAsync(medida),
    update: (id: string, data: Partial<FichaMedidaPayload>) =>
      updateMutation.mutateAsync({ id, data }),
    remove: (id: string) => deleteMutation.mutateAsync(id),

    isSaving: saveMutation.isPending,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
