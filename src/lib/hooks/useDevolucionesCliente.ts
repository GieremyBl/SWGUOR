'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  aprobarDevolucionCliente,
  createDevolucionCliente,
  fetchDevolucionClienteById,
  fetchDevolucionesCliente,
  rechazarDevolucionCliente,
  type ListarDevolucionesParams,
} from '@/lib/helpers/devoluciones-cliente-helpers';
import type {
  CrearDevolucionClienteInput,
  ResolverDevolucionClienteInput,
} from '@/lib/schemas/devoluciones-cliente';

export const DEVOLUCIONES_CLIENTE_KEY = 'devoluciones-cliente';

export function useDevolucionesCliente(params?: ListarDevolucionesParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [DEVOLUCIONES_CLIENTE_KEY, params],
    queryFn: () => fetchDevolucionesCliente(params),
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CrearDevolucionClienteInput) => createDevolucionCliente(payload),
    onSuccess: () => {
      toast.success('Devolución registrada');
      queryClient.invalidateQueries({ queryKey: [DEVOLUCIONES_CLIENTE_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const aprobarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: ResolverDevolucionClienteInput }) =>
      aprobarDevolucionCliente(id, data),
    onSuccess: () => {
      toast.success('Devolución aprobada');
      queryClient.invalidateQueries({ queryKey: [DEVOLUCIONES_CLIENTE_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rechazarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: ResolverDevolucionClienteInput }) =>
      rechazarDevolucionCliente(id, data),
    onSuccess: () => {
      toast.success('Devolución rechazada');
      queryClient.invalidateQueries({ queryKey: [DEVOLUCIONES_CLIENTE_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    devoluciones: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    obtenerPorId: fetchDevolucionClienteById,
    crear: createMutation.mutateAsync,
    aprobar: aprobarMutation.mutateAsync,
    rechazar: rechazarMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isResolving: aprobarMutation.isPending || rechazarMutation.isPending,
  };
}
