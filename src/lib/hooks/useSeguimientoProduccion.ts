'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchSeguimientosProduccion,
  registrarSeguimientoProduccion,
  actualizarSeguimientoProduccion,
} from '@/lib/helpers/seguimiento-produccion-helpers';
import type { RegistrarEtapaPayload } from '@/lib/schemas/seguimiento-produccion';
import { ORDENES_KEY } from '@/lib/hooks/useOrdenProduccion';

export const SEGUIMIENTO_PRODUCCION_KEY = 'seguimiento-produccion';

interface ApiResponse {
  success: boolean;
  error?: string | null;
  data?: unknown;
}

function invalidateSeguimientoQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orden_id: string,
) {
  queryClient.invalidateQueries({ queryKey: [SEGUIMIENTO_PRODUCCION_KEY, orden_id] });
  queryClient.invalidateQueries({ queryKey: [ORDENES_KEY, orden_id] });
  queryClient.invalidateQueries({ queryKey: [ORDENES_KEY] });
}

export function useSeguimientoProduccion(orden_id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [SEGUIMIENTO_PRODUCCION_KEY, orden_id],
    queryFn: () => fetchSeguimientosProduccion(orden_id),
    enabled: !!orden_id,
    refetchOnWindowFocus: false,
  });

  const registrarMutation = useMutation<ApiResponse, Error, RegistrarEtapaPayload>({
    mutationFn: registrarSeguimientoProduccion,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al registrar etapa');
        return;
      }
      toast.success('Etapa registrada');
      invalidateSeguimientoQueries(queryClient, orden_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const observacionesMutation = useMutation<
    ApiResponse,
    Error,
    { id: string; observaciones: string | null }
  >({
    mutationFn: ({ id, observaciones }) =>
      actualizarSeguimientoProduccion(id, { observaciones }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al actualizar observaciones');
        return;
      }
      toast.success('Observaciones actualizadas');
      invalidateSeguimientoQueries(queryClient, orden_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    seguimientos: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,

    registrarEtapa: (payload: Omit<RegistrarEtapaPayload, 'orden_id'> & { orden_id?: string | number }) =>
      registrarMutation.mutateAsync({
        orden_id: Number(payload.orden_id ?? orden_id),
        etapa: payload.etapa,
        observaciones: payload.observaciones,
      }),
    actualizarObservaciones: (id: string, observaciones: string | null) =>
      observacionesMutation.mutateAsync({ id, observaciones }),

    isRegistrando: registrarMutation.isPending,
    isActualizando: observacionesMutation.isPending,
  };
}
