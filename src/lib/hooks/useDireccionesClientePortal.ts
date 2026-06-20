'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  actualizarDireccionClientePortal,
  crearDireccionClientePortal,
  eliminarDireccionClientePortal,
  fetchDireccionesClientePortal,
} from '@/lib/helpers/direcciones-cliente-helpers';
import type {
  DireccionClienteCreateInput,
  DireccionClienteUpdateInput,
} from '@/lib/schemas/direcciones-cliente';

export const DIRECCIONES_CLIENTE_PORTAL_KEY = 'direcciones-cliente-portal';

export function useDireccionesClientePortal() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [DIRECCIONES_CLIENTE_PORTAL_KEY],
    queryFn: fetchDireccionesClientePortal,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: DireccionClienteCreateInput) => crearDireccionClientePortal(payload),
    onSuccess: () => {
      toast.success('Dirección registrada correctamente');
      queryClient.invalidateQueries({ queryKey: [DIRECCIONES_CLIENTE_PORTAL_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DireccionClienteUpdateInput }) =>
      actualizarDireccionClientePortal(id, data),
    onSuccess: () => {
      toast.success('Dirección actualizada');
      queryClient.invalidateQueries({ queryKey: [DIRECCIONES_CLIENTE_PORTAL_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eliminarDireccionClientePortal(id),
    onSuccess: () => {
      toast.success('Dirección eliminada');
      queryClient.invalidateQueries({ queryKey: [DIRECCIONES_CLIENTE_PORTAL_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    direcciones: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    crear: createMutation.mutateAsync,
    actualizar: updateMutation.mutateAsync,
    eliminar: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    accionId: updateMutation.variables?.id ?? deleteMutation.variables ?? null,
  };
}
