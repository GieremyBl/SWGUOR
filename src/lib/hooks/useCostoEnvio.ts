'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  actualizarCostoEnvio,
  crearCostoEnvio,
  desactivarCostoEnvio,
  fetchCostoEnvioById,
  fetchCostosEnvio,
  COSTO_ENVIO_KEY,
  type ListarCostoEnvioParams,
} from '@/lib/helpers/costo-envio-helpers';
import type {
  ActualizarCostoEnvioInput,
  CrearCostoEnvioInput,
} from '@/lib/schemas/costo-envio';

export { COSTO_ENVIO_KEY };

export function useCostoEnvio(params?: ListarCostoEnvioParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [COSTO_ENVIO_KEY, params],
    queryFn: () => fetchCostosEnvio(params),
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CrearCostoEnvioInput) => crearCostoEnvio(payload),
    onSuccess: () => {
      toast.success('Zona de envío registrada');
      queryClient.invalidateQueries({ queryKey: [COSTO_ENVIO_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarCostoEnvioInput }) =>
      actualizarCostoEnvio(id, data),
    onSuccess: () => {
      toast.success('Costo de envío actualizado');
      queryClient.invalidateQueries({ queryKey: [COSTO_ENVIO_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => desactivarCostoEnvio(id),
    onSuccess: () => {
      toast.success('Zona desactivada');
      queryClient.invalidateQueries({ queryKey: [COSTO_ENVIO_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    zonas: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    obtenerPorId: fetchCostoEnvioById,
    crear: createMutation.mutateAsync,
    actualizar: updateMutation.mutateAsync,
    desactivar: deactivateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
  };
}
