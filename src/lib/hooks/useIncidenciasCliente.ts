'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  crearIncidenciaClientePortal,
  fetchIncidenciaClienteById,
  fetchIncidenciasClienteAdmin,
  fetchIncidenciasClientePortal,
  responderIncidenciaCliente,
  type ListarIncidenciasParams,
} from '@/lib/helpers/incidencias-cliente-helpers';
import type {
  CrearIncidenciaClienteInput,
  ResponderIncidenciaClienteInput,
} from '@/lib/schemas/incidencias-cliente';

export const INCIDENCIAS_CLIENTE_KEY = 'incidencias-cliente';
export const INCIDENCIAS_CLIENTE_PORTAL_KEY = 'incidencias-cliente-portal';

export function useIncidenciasClientePortal() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [INCIDENCIAS_CLIENTE_PORTAL_KEY],
    queryFn: fetchIncidenciasClientePortal,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CrearIncidenciaClienteInput) => crearIncidenciaClientePortal(payload),
    onSuccess: () => {
      toast.success('Incidencia registrada correctamente');
      queryClient.invalidateQueries({ queryKey: [INCIDENCIAS_CLIENTE_PORTAL_KEY] });
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

export function useIncidenciasClienteAdmin(params?: ListarIncidenciasParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [INCIDENCIAS_CLIENTE_KEY, params],
    queryFn: () => fetchIncidenciasClienteAdmin(params),
    refetchOnWindowFocus: false,
  });

  const responderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: ResponderIncidenciaClienteInput }) =>
      responderIncidenciaCliente(id, data),
    onSuccess: () => {
      toast.success('Respuesta enviada al cliente');
      queryClient.invalidateQueries({ queryKey: [INCIDENCIAS_CLIENTE_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    incidencias: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    obtenerPorId: fetchIncidenciaClienteById,
    responder: responderMutation.mutateAsync,
    isResponding: responderMutation.isPending,
  };
}
