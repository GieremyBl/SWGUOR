'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import {
  fetchUsuarios,
  fetchUsuarioById,
  createUsuario,
  updateUsuario,
  toggleEstadoUsuario,
  deleteUsuario,
} from '@/lib/helpers/usuarios-helpers';

export const USUARIOS_KEY = 'usuarios';

interface MutationResponse {
  success: boolean;
  error?: string | null;
  message?: string | null;
  data?: unknown;
}

export function useUsuarios() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [USUARIOS_KEY],
    queryFn: fetchUsuarios,
  });

  const createMutation = useMutation<MutationResponse, Error, Record<string, unknown>>({
    mutationFn: createUsuario,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al crear');
      } else {
        toast.success('Usuario creado correctamente');
        queryClient.invalidateQueries({ queryKey: [USUARIOS_KEY] });
      }
    },
    onError: (err) => toast.error(err.message || 'Error de conexión'),
  });

  const updateMutation = useMutation<PostgrestSingleResponse<null>, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => updateUsuario(id, data),
    onSuccess: (res) => {
      if (res?.error) {
        toast.error(res.error.message || 'Error al actualizar');
      } else {
        toast.success('Usuario actualizado');
        queryClient.invalidateQueries({ queryKey: [USUARIOS_KEY] });
      }
    },
    onError: (err) => toast.error(err.message || 'Error al actualizar'),
  });

  const toggleMutation = useMutation<MutationResponse, Error, { id: string; estado: string }>({
    mutationFn: ({ id, estado }) => toggleEstadoUsuario(id, estado),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al actualizar estado');
      } else {
        toast.success('Estado actualizado');
        queryClient.invalidateQueries({ queryKey: [USUARIOS_KEY] });
      }
    },
    onError: (err) => toast.error(err.message || 'Error de conexión'),
  });

  const deleteMutation = useMutation<MutationResponse, Error, string>({
    mutationFn: (id) => deleteUsuario(id),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al eliminar');
      } else {
        toast.success('Usuario eliminado');
        queryClient.invalidateQueries({ queryKey: [USUARIOS_KEY] });
      }
    },
    onError: (err) => toast.error(err.message || 'Error al eliminar'),
  });

  return {
    usuarios: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,

    create: (data: Record<string, unknown>) => createMutation.mutate(data),
    update: (id: string, data: Record<string, unknown>) => updateMutation.mutate({ id, data }),
    toggleEstado: (id: string, estado: string) => toggleMutation.mutate({ id, estado }),
    remove: (id: string) => deleteMutation.mutate(id),

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isToggling: toggleMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useUsuario(id: string) {
  return useQuery({
    queryKey: [USUARIOS_KEY, id],
    queryFn: () => fetchUsuarioById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}