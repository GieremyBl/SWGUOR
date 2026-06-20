'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CONFECCIONES_KEY } from '@/lib/helpers/confecciones-helpers';
import {
  fetchSeguimientosConfeccion,
  registrarSeguimientoConfeccion,
  actualizarSeguimientoConfeccion,
  SEGUIMIENTO_CONFECCION_KEY,
} from '@/lib/helpers/seguimiento-confeccion-helpers';
import type { RegistrarSeguimientoConfeccionPayload } from '@/lib/schemas/seguimiento-confeccion';

export { SEGUIMIENTO_CONFECCION_KEY };

interface ApiResponse {
  success: boolean;
  error?: string | null;
  data?: unknown;
}

function invalidateSeguimientoQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  confeccion_id: string,
) {
  queryClient.invalidateQueries({ queryKey: [SEGUIMIENTO_CONFECCION_KEY, confeccion_id] });
  queryClient.invalidateQueries({ queryKey: [CONFECCIONES_KEY, confeccion_id] });
  queryClient.invalidateQueries({ queryKey: [CONFECCIONES_KEY] });
}

export function useSeguimientoConfeccion(confeccion_id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [SEGUIMIENTO_CONFECCION_KEY, confeccion_id],
    queryFn: () => fetchSeguimientosConfeccion(confeccion_id),
    enabled: !!confeccion_id,
    refetchOnWindowFocus: false,
  });

  const registrarMutation = useMutation<
    ApiResponse,
    Error,
    Omit<RegistrarSeguimientoConfeccionPayload, 'confeccion_id'>
  >({
    mutationFn: (payload) =>
      registrarSeguimientoConfeccion({
        confeccion_id: Number(confeccion_id),
        ...payload,
      }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al registrar seguimiento');
        return;
      }
      toast.success('Cambio de estado registrado');
      invalidateSeguimientoQueries(queryClient, confeccion_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  const notasMutation = useMutation<
    ApiResponse,
    Error,
    { id: string; notas: string | null }
  >({
    mutationFn: ({ id, notas }) => actualizarSeguimientoConfeccion(id, { notas }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al actualizar notas');
        return;
      }
      toast.success('Notas actualizadas');
      invalidateSeguimientoQueries(queryClient, confeccion_id);
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    seguimientos: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,

    registrarCambio: (
      payload: Omit<RegistrarSeguimientoConfeccionPayload, 'confeccion_id'>,
    ) => registrarMutation.mutateAsync(payload),
    actualizarNotas: (id: string, notas: string | null) =>
      notasMutation.mutateAsync({ id, notas }),

    isRegistrando: registrarMutation.isPending,
    isActualizando: notasMutation.isPending,
  };
}
