'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  crearDevolucionSoportePortal,
  crearIncidenciaSoportePortal,
  fetchDevolucionesSoportePortal,
  fetchIncidenciasSoportePortal,
  fetchPedidosEntregadosSoportePortal,
} from '@/lib/helpers/soporte-portal-helpers';
import type { CrearIncidenciaClienteInput } from '@/lib/schemas/incidencias-cliente';
import type { CrearDevolucionClientePortalInput } from '@/lib/schemas/soporte-portal';

export const SOPORTE_INCIDENCIAS_KEY = 'soporte-portal-incidencias';
export const SOPORTE_DEVOLUCIONES_KEY = 'soporte-portal-devoluciones';
export const SOPORTE_PEDIDOS_ENTREGADOS_KEY = 'soporte-portal-pedidos-entregados';

export function useSoporteIncidenciasPortal() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [SOPORTE_INCIDENCIAS_KEY],
    queryFn: fetchIncidenciasSoportePortal,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CrearIncidenciaClienteInput) => crearIncidenciaSoportePortal(payload),
    onSuccess: () => {
      toast.success('Incidencia registrada correctamente');
      queryClient.invalidateQueries({ queryKey: [SOPORTE_INCIDENCIAS_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    incidencias: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    crear: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useSoporteDevolucionesPortal() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [SOPORTE_DEVOLUCIONES_KEY],
    queryFn: fetchDevolucionesSoportePortal,
    refetchOnWindowFocus: false,
  });

  const pedidosQuery = useQuery({
    queryKey: [SOPORTE_PEDIDOS_ENTREGADOS_KEY],
    queryFn: fetchPedidosEntregadosSoportePortal,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CrearDevolucionClientePortalInput) =>
      crearDevolucionSoportePortal(payload),
    onSuccess: () => {
      toast.success('Solicitud de devolución enviada');
      queryClient.invalidateQueries({ queryKey: [SOPORTE_DEVOLUCIONES_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    devoluciones: listQuery.data ?? [],
    pedidosEntregados: pedidosQuery.data ?? [],
    isLoading: listQuery.isLoading,
    isLoadingPedidos: pedidosQuery.isLoading,
    refetch: listQuery.refetch,
    refetchPedidos: pedidosQuery.refetch,
    crear: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
