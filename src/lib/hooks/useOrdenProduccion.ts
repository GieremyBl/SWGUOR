'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchOrdenesProduccion,
  fetchOrdenProduccionById,
  createOrdenProduccion,
  updateOrdenProduccion,
  registrarEtapaProduccion,
  type OrdenProduccionPayload,
  type OrdenProduccionDetalle,
} from '@/lib/helpers/ordenes-produccion-helpers';

export interface CreateOrdenProduccionInput extends OrdenProduccionPayload {
  notes?: string;
}

export interface RegistrarEtapaInput {
  orden_id: string | number;
  etapa: string;
  observaciones?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string | null;
  message?: string | null;
  data?: T;
}

export const ORDENES_KEY = 'ordenes-produccion';

export function useOrdenesProduccion(options?: {
  page?: number;
  limit?: number;
  search?: string;
  etapa?: string;
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const search = options?.search ?? '';
  const etapa = options?.etapa ?? 'all';

  const { data, isLoading, refetch } = useQuery({
    queryKey: [ORDENES_KEY, page, limit, search, etapa],
    queryFn: () => fetchOrdenesProduccion({
      page,
      limit,
      search: search || undefined,
      etapa: etapa || undefined,
    }),
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  return {
    ordenes: data?.ordenes ?? [],
    meta: data?.meta ?? {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
      enProceso: 0,
      completadas: 0,
    },
    isLoading,
    refetch,
  };
}

export function useOrdenProduccionDetalle(id: string) {
  return useQuery<OrdenProduccionDetalle>({
    queryKey: [ORDENES_KEY, id],
    queryFn: () => fetchOrdenProduccionById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

export function useCreateOrdenProduccion() {
  const queryClient = useQueryClient();

  const createMutation = useMutation<ApiResponse, Error, CreateOrdenProduccionInput>({
    mutationFn: (payload) => createOrdenProduccion({
      producto_id: payload.producto_id,
      taller_id: payload.taller_id,
      ficha_id: payload.ficha_id,
      pedido_id: payload.pedido_id,
      cantidad_solicitada: payload.cantidad_solicitada,
      fecha_entrega: payload.fecha_entrega,
      notas: payload.notas ?? payload.notes,
    }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al crear la orden');
        return;
      }
      toast.success('Orden de producción creada correctamente');
      queryClient.invalidateQueries({ queryKey: [ORDENES_KEY] });
    },
    onError: () => toast.error('Error de conexión con el servidor'),
  });

  const etapaMutation = useMutation<ApiResponse, Error, RegistrarEtapaInput>({
    mutationFn: (payload) => registrarEtapaProduccion({
      orden_id: String(payload.orden_id),
      etapa: payload.etapa,
      observaciones: payload.observaciones,
    }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al registrar la nueva etapa');
        return;
      }
      toast.success('Etapa de producción actualizada');
      queryClient.invalidateQueries({ queryKey: [ORDENES_KEY] });
    },
    onError: () => toast.error('Error de conexión al cambiar de etapa'),
  });

  return {
    create: (data: CreateOrdenProduccionInput) => createMutation.mutate(data),
    registrarEtapa: (data: RegistrarEtapaInput) => etapaMutation.mutate(data),
    isCreating: createMutation.isPending,
    isChangingEtapa: etapaMutation.isPending,
  };
}

export function useUpdateOrdenProduccion() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation<
    ApiResponse,
    Error,
    { id: string | number; data: CreateOrdenProduccionInput }
  >({
    mutationFn: ({ id, data }) => updateOrdenProduccion(String(id), {
      producto_id: data.producto_id,
      taller_id: data.taller_id,
      ficha_id: data.ficha_id,
      pedido_id: data.pedido_id,
      cantidad_solicitada: data.cantidad_solicitada,
      fecha_entrega: data.fecha_entrega,
      notas: data.notas ?? data.notes,
    }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al actualizar la orden');
        return;
      }
      toast.success('Orden de producción actualizada correctamente');
      queryClient.invalidateQueries({ queryKey: [ORDENES_KEY] });
    },
    onError: () => toast.error('Error de conexión al intentar actualizar'),
  });

  return {
    update: (id: string | number, data: CreateOrdenProduccionInput) =>
      updateMutation.mutate({ id, data }),
    isUpdating: updateMutation.isPending,
  };
}
