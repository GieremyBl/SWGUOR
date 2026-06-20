'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  cancelarConfeccion,
  createConfeccion,
  fetchConfeccionById,
  fetchConfecciones,
  CONFECCIONES_KEY,
  registrarSeguimientoConfeccion,
  updateConfeccion,
  updateEstadoConfeccion,
  type ListarConfeccionesParams,
} from '@/lib/helpers/confecciones-helpers';
import type {
  ActualizarConfeccionInput,
  ConfeccionOutput,
  CrearConfeccionInput,
} from '@/lib/schemas/confecciones';
import { SEGUIMIENTO_CONFECCION_KEY } from '@/lib/helpers/seguimiento-confeccion-helpers';

export { CONFECCIONES_KEY };

export function useConfecciones(params?: ListarConfeccionesParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [CONFECCIONES_KEY, params],
    queryFn: () => fetchConfecciones(params),
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: CrearConfeccionInput | ConfeccionOutput) => createConfeccion(data),
    onSuccess: () => {
      toast.success('Orden de confección creada');
      queryClient.invalidateQueries({ queryKey: [CONFECCIONES_KEY] });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error al crear'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ActualizarConfeccionInput }) =>
      updateConfeccion(id, data),
    onSuccess: () => {
      toast.success('Confección actualizada');
      queryClient.invalidateQueries({ queryKey: [CONFECCIONES_KEY] });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error al actualizar'),
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado, notas }: { id: string; estado: string; notas?: string }) =>
      updateEstadoConfeccion(id, estado, notas),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: [CONFECCIONES_KEY] });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error al actualizar'),
  });

  const cancelarMutation = useMutation({
    mutationFn: ({ id, notas }: { id: string; notas?: string }) => cancelarConfeccion(id, notas),
    onSuccess: () => {
      toast.success('Confección cancelada');
      queryClient.invalidateQueries({ queryKey: [CONFECCIONES_KEY] });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error al cancelar'),
  });

  const seguimientoMutation = useMutation({
    mutationFn: registrarSeguimientoConfeccion,
    onSuccess: () => {
      toast.success('Seguimiento registrado');
      queryClient.invalidateQueries({ queryKey: [CONFECCIONES_KEY] });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error'),
  });

  return {
    confecciones: query.data?.data ?? [],
    meta: query.data?.meta,
    prioridadCounts: query.data?.prioridadCounts,
    isLoading: query.isLoading,
    refetch: query.refetch,
    obtenerPorId: fetchConfeccionById,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    updateEstado: (id: string, estado: string, notas?: string) =>
      updateEstadoMutation.mutateAsync({ id, estado, notas }),
    cancelar: cancelarMutation.mutateAsync,
    registrarSeguimiento: seguimientoMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUpdatingEstado: updateEstadoMutation.isPending,
    isCanceling: cancelarMutation.isPending,
    isRegistrando: seguimientoMutation.isPending,
  };
}

export function useConfeccion(id: string) {
  return useQuery({
    queryKey: [CONFECCIONES_KEY, id],
    queryFn: () => fetchConfeccionById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

export function useConfeccionDetalle(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [CONFECCIONES_KEY, id],
    queryFn: () => fetchConfeccionById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ estado, notas }: { estado: string; notas?: string }) =>
      updateEstadoConfeccion(id, estado, notas),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: [CONFECCIONES_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [SEGUIMIENTO_CONFECCION_KEY, id] });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error al actualizar'),
  });

  const seguimientoMutation = useMutation({
    mutationFn: registrarSeguimientoConfeccion,
    onSuccess: () => {
      toast.success('Seguimiento registrado');
      queryClient.invalidateQueries({ queryKey: [CONFECCIONES_KEY, id] });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Error'),
  });

  return {
    confeccion: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
    updateEstado: (estado: string, notas?: string) =>
      updateEstadoMutation.mutateAsync({ estado, notas }),
    registrarSeguimiento: seguimientoMutation.mutateAsync,
    isUpdating: updateEstadoMutation.isPending,
    isRegistrando: seguimientoMutation.isPending,
  };
}
