'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchPrecioHistorico,
  createPrecioHistorico,
  updatePrecioHistorico,
  deletePrecioHistorico,
} from '@/lib/helpers/precioHistoricoHelpers';
import type { CreatePrecioHistoricoInput } from '@/lib/helpers/precioHistoricoHelpers'; 

export const PRECIO_HISTORICO_KEY = 'precio-historico';

// Interfaz para estructurar la respuesta esperada en la consulta del listado
export interface PrecioHistorico {
  id: number;
  productoId: string;
  precioAnterior: number;
  precioNuevo: number;
  moneda: "PEN" | "USD";
  tipoProducto: "MATERIA_PRIMA" | "CONFECCIONADO";
  fechaVigencia: Date;
  razonCambio: "AJUSTE_MERCADO" | "INFLACION" | "COSTO_PROVEEDOR" | "PROMOCION" | "OTRO";
  porcentajeCambio: number;
  creadoPor: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

// Interfaz estricta para las validaciones operativas de la UI local
interface ApiResponse {
  success:  boolean;
  error?:   string | null;
  message?: string | null;
  data?:    unknown;
}

export function usePrecioHistorico(producto_id?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<PrecioHistorico[], Error>({
    queryKey: [PRECIO_HISTORICO_KEY, producto_id],
    queryFn: async () => {
      const res = await fetchPrecioHistorico(producto_id);
      return res as unknown as PrecioHistorico[];
    },
    enabled: !!producto_id,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation<ApiResponse, Error, CreatePrecioHistoricoInput>({
    mutationFn: async (variables) => {
      const res = await createPrecioHistorico(variables);
      return res as unknown as ApiResponse;
    },
    onSuccess: () => {
      toast.success('Registro de precio histórico creado');
      queryClient.invalidateQueries({ queryKey: [PRECIO_HISTORICO_KEY, producto_id] });
    },
    onError: () => toast.error('Error al crear registro'),
  });

  const updateMutation = useMutation<ApiResponse, Error, { id: string; data: Partial<CreatePrecioHistoricoInput> & Record<string, unknown> }>({
    mutationFn: async ({ id, data }) => {
      const res = await updatePrecioHistorico(id, data);
      return res as unknown as ApiResponse;
    },
    onSuccess: () => {
      toast.success('Precio histórico actualizado');
      queryClient.invalidateQueries({ queryKey: [PRECIO_HISTORICO_KEY, producto_id] });
    },
    onError: () => toast.error('Error al actualizar registro'),
  });

  const deleteMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: async (id) => {
      const res = await deletePrecioHistorico(id);
      return res as unknown as ApiResponse;
    },
    onSuccess: () => {
      toast.success('Registro eliminado');
      queryClient.invalidateQueries({ queryKey: [PRECIO_HISTORICO_KEY, producto_id] });
    },
    onError: () => toast.error('Error al eliminar registro'),
  });

  return {
    historico: query.data ?? [],
    isLoading: query.isLoading,
    refetch:   query.refetch,

    create: (variables: CreatePrecioHistoricoInput) => createMutation.mutate(variables),
    update: (variables: { id: string; data: Partial<CreatePrecioHistoricoInput> & Record<string, unknown> }) => updateMutation.mutate(variables),
    remove: (id: string) => deleteMutation.mutate(id),

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}