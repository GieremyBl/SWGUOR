'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  asignarIncidenciaTaller,
  crearIncidenciaTaller,
  editarIncidenciaTaller,
  fetchIncidenciaTallerById,
  fetchIncidenciasTaller,
  INCIDENCIAS_TALLER_KEY,
  resolverIncidenciaTaller,
  type ListarIncidenciasTallerParams,
} from '@/lib/helpers/incidencias-taller-helpers';
import type {
  AsignarIncidenciaTallerInput,
  CrearIncidenciaTallerInput,
  EditarIncidenciaTallerInput,
  ResolverIncidenciaTallerInput,
} from '@/lib/schemas/incidencias-taller';

export { INCIDENCIAS_TALLER_KEY };

export function useIncidenciasTaller(params?: ListarIncidenciasTallerParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [INCIDENCIAS_TALLER_KEY, params],
    queryFn: () => fetchIncidenciasTaller(params),
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CrearIncidenciaTallerInput) => crearIncidenciaTaller(payload),
    onSuccess: () => {
      toast.success('Incidencia registrada');
      queryClient.invalidateQueries({ queryKey: [INCIDENCIAS_TALLER_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resolverMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: ResolverIncidenciaTallerInput }) =>
      resolverIncidenciaTaller(id, data),
    onSuccess: () => {
      toast.success('Incidencia resuelta');
      queryClient.invalidateQueries({ queryKey: [INCIDENCIAS_TALLER_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const asignarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: AsignarIncidenciaTallerInput }) =>
      asignarIncidenciaTaller(id, data),
    onSuccess: () => {
      toast.success('Incidencia asignada');
      queryClient.invalidateQueries({ queryKey: [INCIDENCIAS_TALLER_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: EditarIncidenciaTallerInput }) =>
      editarIncidenciaTaller(id, data),
    onSuccess: () => {
      toast.success('Incidencia actualizada');
      queryClient.invalidateQueries({ queryKey: [INCIDENCIAS_TALLER_KEY] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    incidencias: listQuery.data?.data ?? [],
    meta: listQuery.data?.meta,
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    obtenerPorId: fetchIncidenciaTallerById,
    crear: createMutation.mutateAsync,
    resolver: resolverMutation.mutateAsync,
    asignar: asignarMutation.mutateAsync,
    editar: editarMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isResolving: resolverMutation.isPending,
    isAssigning: asignarMutation.isPending,
    isEditing: editarMutation.isPending,
  };
}
