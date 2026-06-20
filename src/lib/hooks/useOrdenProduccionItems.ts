'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchOrdenProduccionItems,
  agregarOrdenProduccionItem,
  actualizarOrdenProduccionItem,
  eliminarOrdenProduccionItem,
} from '@/lib/helpers/ordenes-produccion-items-helpers';
import type { OrdenProduccionItemPayload } from '@/lib/schemas/ordenes-produccion-items';
import { ORDENES_KEY } from '@/lib/hooks/useOrdenProduccion';

export const ORDEN_ITEMS_KEY = 'orden-produccion-items';

interface ApiResponse {
  success: boolean;
  error?: string | null;
  data?: unknown;
}

function invalidateItemsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orden_produccion_id: string,
) {
  queryClient.invalidateQueries({ queryKey: [ORDEN_ITEMS_KEY, orden_produccion_id] });
  queryClient.invalidateQueries({ queryKey: [ORDENES_KEY, orden_produccion_id] });
  queryClient.invalidateQueries({ queryKey: [ORDENES_KEY] });
}

export type { OrdenProduccionItemPayload as OrdenProduccionItemInput };

export function useOrdenProduccionItems(orden_produccion_id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [ORDEN_ITEMS_KEY, orden_produccion_id],
    queryFn: () => fetchOrdenProduccionItems(orden_produccion_id),
    enabled: !!orden_produccion_id,
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation<ApiResponse, Error, OrdenProduccionItemPayload>({
    mutationFn: (item) => agregarOrdenProduccionItem(orden_produccion_id, item),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al agregar ítem');
        return;
      }
      toast.success('Ítem agregado');
      invalidateItemsQueries(queryClient, orden_produccion_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const updateMutation = useMutation<
    ApiResponse,
    Error,
    { id: string; data: Partial<OrdenProduccionItemPayload> }
  >({
    mutationFn: ({ id, data }) => actualizarOrdenProduccionItem(id, data),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al actualizar ítem');
        return;
      }
      toast.success('Ítem actualizado');
      invalidateItemsQueries(queryClient, orden_produccion_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const deleteMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: eliminarOrdenProduccionItem,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al eliminar ítem');
        return;
      }
      toast.success('Ítem eliminado');
      invalidateItemsQueries(queryClient, orden_produccion_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,

    add: (item: OrdenProduccionItemPayload) => addMutation.mutateAsync(item),
    update: (id: string, data: Partial<OrdenProduccionItemPayload>) =>
      updateMutation.mutateAsync({ id, data }),
    remove: (id: string) => deleteMutation.mutateAsync(id),

    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
