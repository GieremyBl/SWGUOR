'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchTarifasTaller,
  crearTarifaTaller,
  actualizarTarifaTaller,
  desactivarTarifaTaller,
  calcularCostoTarifaTaller,
} from '@/lib/helpers/tarifas-taller-helpers';
import type { TarifaTallerForm } from '@/lib/schemas/tarifa-talleres';

export const TARIFAS_TALLER_KEY = 'tarifas-taller';

interface ApiResponse {
  success: boolean;
  error?: string | null;
  data?: unknown;
}

function invalidateTarifas(
  queryClient: ReturnType<typeof useQueryClient>,
  taller_id?: string,
) {
  queryClient.invalidateQueries({ queryKey: [TARIFAS_TALLER_KEY] });
  if (taller_id) {
    queryClient.invalidateQueries({ queryKey: [TARIFAS_TALLER_KEY, taller_id] });
  }
}

export function useTarifasTaller(taller_id: string, options?: { activo?: boolean | 'all' }) {
  const queryClient = useQueryClient();
  const activo = options?.activo ?? 'all';

  const query = useQuery({
    queryKey: [TARIFAS_TALLER_KEY, taller_id, activo],
    queryFn: () => fetchTarifasTaller({ taller_id, activo }),
    enabled: !!taller_id,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation<ApiResponse, Error, Omit<TarifaTallerForm, 'taller_id'>>({
    mutationFn: (data) => crearTarifaTaller({ ...data, taller_id: Number(taller_id) }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al crear tarifa');
        return;
      }
      toast.success('Tarifa registrada');
      invalidateTarifas(queryClient, taller_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const updateMutation = useMutation<
    ApiResponse,
    Error,
    { id: string; data: Partial<TarifaTallerForm> }
  >({
    mutationFn: ({ id, data }) => actualizarTarifaTaller(id, data),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al actualizar tarifa');
        return;
      }
      toast.success('Tarifa actualizada');
      invalidateTarifas(queryClient, taller_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const deactivateMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: desactivarTarifaTaller,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al desactivar tarifa');
        return;
      }
      toast.success('Tarifa desactivada');
      invalidateTarifas(queryClient, taller_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    tarifas: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,

    create: (data: Omit<TarifaTallerForm, 'taller_id'>) => createMutation.mutateAsync(data),
    update: (id: string, data: Partial<TarifaTallerForm>) =>
      updateMutation.mutateAsync({ id, data }),
    deactivate: (id: string) => deactivateMutation.mutateAsync(id),
    calcularCosto: (id: string, cantidad: number) => calcularCostoTarifaTaller(id, cantidad),

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
  };
}
