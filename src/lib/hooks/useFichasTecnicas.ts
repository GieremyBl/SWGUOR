'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchFichaPorProducto,
  createFichaTecnica,
  updateFichaTecnica,
  fetchMedidas,
  saveMedidas,
  deleteMedida,
} from '@/lib/helpers/fichas-tecnicas-helpers';
import type { Medida } from '@/lib/schemas/fichas-tecnicas';

export const FICHAS_KEY  = 'fichas-tecnicas';
export const MEDIDAS_KEY = 'ficha-medidas';

// Interfaz estándar para el contrato de respuestas de la API locales
interface ApiResponse {
  success:  boolean;
  error?:   string | null;
  message?: string | null;
  data?:    unknown;
}

export interface CrearFichaTecnicaInput {
  producto_id:            string | number;
  version?:               string;
  descripcion_detallada?: string;
  sam_total?:             number;
  costo_estimado?:        number;
  ficha_url?:             string;
  imagen_geometral?:      string;
}

// ── Hook: useFichaTecnica ───────────────────────────────────────────────────

export function useFichaTecnica(producto_id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [FICHAS_KEY, producto_id],
    queryFn:  () => fetchFichaPorProducto(producto_id),
    enabled:  !!producto_id,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation<ApiResponse, Error, CrearFichaTecnicaInput>({
    mutationFn: createFichaTecnica,
    onSuccess: (res) => {
      if (!res.success) { 
        toast.error(res.error ?? 'Error al crear ficha'); 
        return; 
      }
      toast.success('Ficha técnica creada');
      queryClient.invalidateQueries({ queryKey: [FICHAS_KEY, producto_id] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  // Para la actualización podemos usar Partial de la creación unida a propiedades libres si se requiere
  const updateMutation = useMutation<ApiResponse, Error, { id: string; data: Partial<CrearFichaTecnicaInput> & Record<string, unknown> }>({
    mutationFn: ({ id, data }) => updateFichaTecnica(id, data),
    onSuccess: (res) => {
      if (!res.success) { 
        toast.error(res.error ?? 'Error al actualizar'); 
        return; 
      }
      toast.success('Ficha actualizada');
      queryClient.invalidateQueries({ queryKey: [FICHAS_KEY, producto_id] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    ficha:     query.data ?? null,
    isLoading: query.isLoading,
    refetch:   query.refetch,

    create: (data: CrearFichaTecnicaInput) => createMutation.mutate(data),
    update: (id: string, data: Partial<CrearFichaTecnicaInput> & Record<string, unknown>) => updateMutation.mutate({ id, data }),

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

// ── Hook: useFichaMedidas ────────────────────────────────────────────────────

export function useFichaMedidas(ficha_id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [MEDIDAS_KEY, ficha_id],
    queryFn:  () => fetchMedidas(ficha_id),
    enabled:  !!ficha_id,
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation<ApiResponse, Error, { medidas: Omit<Medida, 'id'>[] }>({
    mutationFn: ({ medidas }) => saveMedidas(ficha_id, medidas),
    onSuccess: (res) => {
      if (!res.success) { 
        toast.error(res.error ?? 'Error al guardar medidas'); 
        return; 
      }
      toast.success('Medidas guardadas');
      queryClient.invalidateQueries({ queryKey: [MEDIDAS_KEY, ficha_id] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const deleteMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: deleteMedida,
    onSuccess: () => {
      toast.success('Medida eliminada');
      queryClient.invalidateQueries({ queryKey: [MEDIDAS_KEY, ficha_id] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    medidas:   query.data ?? [],
    isLoading: query.isLoading,
    refetch:   query.refetch,

    save:   (medidas: Omit<Medida, 'id'>[]) => saveMutation.mutate({ medidas }),
    remove: (id: string)                    => deleteMutation.mutate(id),

    isSaving:   saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}