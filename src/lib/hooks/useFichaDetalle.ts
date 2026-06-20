'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchFichaDetalle,
  saveFichaDetalle,
  agregarFichaDetalleItem,
  actualizarFichaDetalleItem,
  deleteFichaDetalleItem,
  type FichaDetalleItemPayload,
} from '@/lib/helpers/fichas-tecnicas-detalle-helpers';
import type { FichaDetalleRow } from '@/lib/schemas/fichas-tecnicas-detalle';

export const FICHA_DETALLE_KEY = 'ficha-detalle';
const FICHA_TECNICA_KEY = 'ficha-tecnica-detalle';

interface ApiResponse {
  success: boolean;
  error?: string | null;
  message?: string | null;
  data?: unknown;
}

function invalidateDetalleQueries(queryClient: ReturnType<typeof useQueryClient>, ficha_id: string) {
  queryClient.invalidateQueries({ queryKey: [FICHA_DETALLE_KEY, ficha_id] });
  queryClient.invalidateQueries({ queryKey: [FICHA_TECNICA_KEY, ficha_id] });
}

export type { FichaDetalleItemPayload as FichaDetalleItemInput };

export function useFichaDetalle(ficha_id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [FICHA_DETALLE_KEY, ficha_id],
    queryFn: () => fetchFichaDetalle(ficha_id),
    enabled: !!ficha_id,
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation<ApiResponse, Error, FichaDetalleItemPayload[]>({
    mutationFn: (items) => saveFichaDetalle(ficha_id, items),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al guardar');
        return;
      }
      toast.success('Detalle guardado');
      invalidateDetalleQueries(queryClient, ficha_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const addMutation = useMutation<ApiResponse, Error, FichaDetalleItemPayload>({
    mutationFn: (item) => agregarFichaDetalleItem(ficha_id, item),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al agregar');
        return;
      }
      toast.success('Ítem agregado');
      invalidateDetalleQueries(queryClient, ficha_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const updateMutation = useMutation<
    ApiResponse,
    Error,
    { id: string; data: Partial<FichaDetalleItemPayload> }
  >({
    mutationFn: ({ id, data }) => actualizarFichaDetalleItem(id, data),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al actualizar');
        return;
      }
      toast.success('Ítem actualizado');
      invalidateDetalleQueries(queryClient, ficha_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const deleteMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: deleteFichaDetalleItem,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al eliminar');
        return;
      }
      toast.success('Ítem eliminado');
      invalidateDetalleQueries(queryClient, ficha_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    detalles: (query.data ?? []) as FichaDetalleRow[],
    isLoading: query.isLoading,
    refetch: query.refetch,

    save: (items: FichaDetalleItemPayload[]) => saveMutation.mutateAsync(items),
    add: (item: FichaDetalleItemPayload) => addMutation.mutateAsync(item),
    update: (id: string, data: Partial<FichaDetalleItemPayload>) =>
      updateMutation.mutateAsync({ id, data }),
    remove: (id: string) => deleteMutation.mutateAsync(id),

    isSaving: saveMutation.isPending,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
