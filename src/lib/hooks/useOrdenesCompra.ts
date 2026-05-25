'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchOrdenesCompra,
  fetchOrdenCompraById,
  crearOrdenCompra,
  crearOrdenDesdeCotizacion,
  actualizarOrdenCompra,
  confirmarOrdenCompra,
  cancelarOrdenCompra,
} from '@/lib/helpers/ordenes-compra-helpers';
import type {
  CrearOrdenCompra,
  CrearOrdenDesdeCotizacion,
  ActualizarOrdenCompra,
} from '@/lib/schemas/ordenes-compra';

export const ORDENES_COMPRA_KEY = 'ordenes-compra';

interface UseOrdenesCompraOptions {
  proveedor_id?: string;
  estado?: string;
  enabled?: boolean;
}

export function useOrdenesCompra(options: UseOrdenesCompraOptions = {}) {
  const queryClient = useQueryClient();
  const { proveedor_id, estado, enabled = true } = options;

  const params: Record<string, string> = {};
  if (proveedor_id) params.proveedor_id = proveedor_id;
  if (estado) params.estado = estado;

  const query = useQuery({
    queryKey: [ORDENES_COMPRA_KEY, params],
    queryFn: async () => {
      const res = await fetchOrdenesCompra(params);
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
    enabled,
    refetchOnWindowFocus: false,
  });

  const crearMutation = useMutation({
    mutationFn: crearOrdenCompra,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al crear orden');
        return;
      }
      toast.success('Orden de compra creada');
      queryClient.invalidateQueries({ queryKey: [ORDENES_COMPRA_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const desdeCotizacionMutation = useMutation({
    mutationFn: crearOrdenDesdeCotizacion,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al generar orden');
        return;
      }
      toast.success('Orden de compra generada desde cotización');
      queryClient.invalidateQueries({ queryKey: [ORDENES_COMPRA_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const confirmarMutation = useMutation({
    mutationFn: confirmarOrdenCompra,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al confirmar');
        return;
      }
      toast.success('Orden confirmada');
      queryClient.invalidateQueries({ queryKey: [ORDENES_COMPRA_KEY] });
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: cancelarOrdenCompra,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al cancelar');
        return;
      }
      toast.success('Orden cancelada');
      queryClient.invalidateQueries({ queryKey: [ORDENES_COMPRA_KEY] });
    },
  });

  return {
    ordenes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    crear: (datos: CrearOrdenCompra) => crearMutation.mutateAsync(datos),
    crearDesdeCotizacion: (datos: CrearOrdenDesdeCotizacion) =>
      desdeCotizacionMutation.mutateAsync(datos),
    confirmar: (id: string | number) => confirmarMutation.mutateAsync(id),
    cancelar: (id: string | number) => cancelarMutation.mutateAsync(id),
    isCreating: crearMutation.isPending || desdeCotizacionMutation.isPending,
    isConfirming: confirmarMutation.isPending,
    isCancelling: cancelarMutation.isPending,
  };
}

export function useOrdenCompraDetalle(id: string | null) {
  return useQuery({
    queryKey: [ORDENES_COMPRA_KEY, id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetchOrdenCompraById(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useActualizarOrdenCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string | number; datos: ActualizarOrdenCompra }) =>
      actualizarOrdenCompra(id, datos),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al actualizar');
        return;
      }
      toast.success('Orden actualizada');
      queryClient.invalidateQueries({ queryKey: [ORDENES_COMPRA_KEY] });
    },
  });
}
