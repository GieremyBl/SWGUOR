'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchPedidos,
  fetchPedidoById,
  updatePedido,
  registrarSeguimientoPedido,
} from '@/lib/helpers/pedidos-helpers';

export const PEDIDOS_KEY = 'pedidos';

// Interfaces estructurales del dominio de Pedidos
export interface Pedido {
  id:           string;
  numero_orden: string;
  estado:       string;
  total:        number;
  created_at?:  string;
  [key: string]: unknown;
}

// Interfaz estricta para el payload del registro de seguimiento
export interface RegistrarSeguimientoInput {
  pedido_id: string;
  status:    string;
  notas?:    string;
}

// Contrato estándar de respuestas de API mutables o envolventes
interface ApiResponse<T = unknown> {
  success:  boolean;
  error?:   string | null;
  message?: string | null;
  data?:    T;
}

// ── Hook: usePedidos ────────────────────────────────────────────────────────

export function usePedidos() {
  const queryClient = useQueryClient();

  // El helper puede retornar el array directo de pedidos o venir envuelto en ApiResponse
  const query = useQuery<Pedido[] | ApiResponse<Pedido[]>, Error>({
    queryKey: [PEDIDOS_KEY],
    queryFn:  async () => {
      const res = await fetchPedidos();
      return res as unknown as Pedido[] | ApiResponse<Pedido[]>;
    },
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation<ApiResponse, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => updatePedido(id, data),
    onSuccess: (res) => {
      if (!res.success) { 
        toast.error(res.error ?? 'Error al actualizar'); 
        return; 
      }
      toast.success('Pedido actualizado');
      queryClient.invalidateQueries({ queryKey: [PEDIDOS_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const seguimientoMutation = useMutation<ApiResponse, Error, RegistrarSeguimientoInput>({
    mutationFn: registrarSeguimientoPedido,
    onSuccess: (res) => {
      if (!res.success) { 
        toast.error(res.error ?? 'Error'); 
        return; 
      }
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: [PEDIDOS_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  // ── Resolución de datos tipada y libre de 'any' ───────────────────────────
  const rawData = query.data;
  const pedidos: Pedido[] = Array.isArray(rawData)
    ? rawData
    : (rawData && typeof rawData === 'object' && 'data' in rawData && Array.isArray(rawData.data))
      ? (rawData.data as Pedido[]) // Extracción segura si el helper devuelve { data: [...] }
      : [];

  return {
    pedidos,
    isLoading:  query.isLoading,
    refetch:    query.refetch,

    update: (id: string, data: Record<string, unknown>) => updateMutation.mutate({ id, data }),
    registrarSeguimiento: (data: RegistrarSeguimientoInput) => seguimientoMutation.mutate(data),

    isUpdating:    updateMutation.isPending,
    isRegistrando: seguimientoMutation.isPending,
  };
}

// ── Hook: usePedido (Individual) ──────────────────────────────────────────

export function usePedido(id: string) {
  return useQuery<Pedido | ApiResponse<Pedido>, Error>({
    queryKey: [PEDIDOS_KEY, id], 
    queryFn:  async () => {
      const res = await fetchPedidoById(id);
      return res as unknown as Pedido | ApiResponse<Pedido>;
    },
    enabled:  !!id,
    refetchOnWindowFocus: false,
  });
}