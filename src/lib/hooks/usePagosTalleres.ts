'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  actualizarPagoTaller,
  anularPagoTaller,
  crearPagoTaller,
  fetchPagoTallerById,
  fetchPagosTaller,
  PAGOS_TALLER_KEY,
  registrarPagoTaller,
  type ListarPagosTallerParams,
} from '@/lib/helpers/pagos-taller-helpers';
import type {
  ActualizarPagoTallerInput,
  AnularPagoTallerInput,
  CrearPagoTallerInput,
  RegistrarPagoTallerInput,
} from '@/lib/schemas/pagos-talleres';

export { PAGOS_TALLER_KEY };

export function usePagosTalleres(params?: ListarPagosTallerParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [PAGOS_TALLER_KEY, params],
    queryFn: () => fetchPagosTaller(params),
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CrearPagoTallerInput) => crearPagoTaller(payload),
    onSuccess: () => {
      toast.success('Pago registrado');
      queryClient.invalidateQueries({ queryKey: [PAGOS_TALLER_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: ActualizarPagoTallerInput }) =>
      actualizarPagoTaller(id, data),
    onSuccess: () => {
      toast.success('Pago actualizado');
      queryClient.invalidateQueries({ queryKey: [PAGOS_TALLER_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const registrarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: RegistrarPagoTallerInput }) =>
      registrarPagoTaller(id, data),
    onSuccess: () => {
      toast.success('Pago confirmado como pagado');
      queryClient.invalidateQueries({ queryKey: [PAGOS_TALLER_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const anularMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data?: AnularPagoTallerInput }) =>
      anularPagoTaller(id, data),
    onSuccess: () => {
      toast.success('Pago anulado');
      queryClient.invalidateQueries({ queryKey: [PAGOS_TALLER_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    pagos: listQuery.data?.data ?? [],
    meta: listQuery.data?.meta,
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    obtenerPorId: fetchPagoTallerById,
    crear: createMutation.mutateAsync,
    actualizar: updateMutation.mutateAsync,
    registrar: registrarMutation.mutateAsync,
    anular: anularMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRegistering: registrarMutation.isPending,
    isAnulling: anularMutation.isPending,
  };
}
