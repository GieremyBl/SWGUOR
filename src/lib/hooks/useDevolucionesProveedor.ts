'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createDevolucionProveedor,
  fetchDevolucionProveedorById,
  fetchDevolucionesProveedor,
  updateEstadoDevolucionProveedor,
  type ListarDevolucionesProveedorParams,
} from '@/lib/helpers/devoluciones-proveedor-helpers';
import type {
  ActualizarEstadoDevolucionProveedorInput,
  CrearDevolucionProveedorInput,
} from '@/lib/schemas/devoluciones-proveedor';

export const DEVOLUCIONES_PROVEEDOR_KEY = 'devoluciones-proveedor';

export function useDevolucionesProveedor(params?: ListarDevolucionesProveedorParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [DEVOLUCIONES_PROVEEDOR_KEY, params],
    queryFn: () => fetchDevolucionesProveedor(params),
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CrearDevolucionProveedorInput) => createDevolucionProveedor(payload),
    onSuccess: () => {
      toast.success('Devolución a proveedor registrada');
      queryClient.invalidateQueries({ queryKey: [DEVOLUCIONES_PROVEEDOR_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: ActualizarEstadoDevolucionProveedorInput;
    }) => updateEstadoDevolucionProveedor(id, data),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: [DEVOLUCIONES_PROVEEDOR_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    devoluciones: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    obtenerPorId: fetchDevolucionProveedorById,
    crear: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    actualizarEstado: updateEstadoMutation.mutateAsync,
    isUpdatingEstado: updateEstadoMutation.isPending,
  };
}
