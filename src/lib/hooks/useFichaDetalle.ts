'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchFichaDetalle,
  saveFichaDetalle,
  deleteFichaDetalleItem,
} from '@/lib/helpers/fichas-tecnicas-detalle-helpers';

export const FICHA_DETALLE_KEY = 'ficha-detalle';

export interface FichaDetalleItemInput {
  material_id?:           string | number;
  insumo_id?:             string | number;
  cantidad_consumo:       number;
  porcentaje_desperdicio?: number;
  observaciones?:         string; 
  [key: string]:          unknown;
}

interface ApiResponse {
  success:  boolean;
  error?:   string | null;
  message?: string | null;
  data?:    unknown;
}

export function useFichaDetalle(ficha_id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [FICHA_DETALLE_KEY, ficha_id],
    queryFn:  () => fetchFichaDetalle(ficha_id),
    enabled:  !!ficha_id,
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation<ApiResponse, Error, FichaDetalleItemInput[]>({
    mutationFn: (items) => saveFichaDetalle(ficha_id, items),
    onSuccess: (res) => {
      if (!res.success) { 
        toast.error(res.error ?? 'Error al guardar'); 
        return; 
      }
      toast.success('Detalle guardado');
      queryClient.invalidateQueries({ queryKey: [FICHA_DETALLE_KEY, ficha_id] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const deleteMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: deleteFichaDetalleItem,
    onSuccess: () => {
      toast.success('Item eliminado');
      queryClient.invalidateQueries({ queryKey: [FICHA_DETALLE_KEY, ficha_id] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    detalles:  query.data ?? [],
    isLoading: query.isLoading,
    refetch:   query.refetch,

    save:   (items: FichaDetalleItemInput[]) => saveMutation.mutate(items),
    remove: (id: string)   => deleteMutation.mutate(id),

    isSaving:   saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}