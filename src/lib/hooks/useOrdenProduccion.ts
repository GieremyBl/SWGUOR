'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createOrdenProduccion } from '@/lib/helpers/ordenes-produccion-helpers';
import { getSupabaseBrowserClient } from '@/lib/supabase';

// 1. Definimos la interfaz estricta con las propiedades exactas que tu helper exige
export interface CreateOrdenProduccionInput {
  producto_id:         string | number;
  taller_id:           string | number;
  ficha_id:            string | number;
  pedido_id?:          string | number; 
  cantidad_solicitada: number;
  fecha_entrega?:      string;
  notes?:              string;
}

// Nueva interfaz para el registro de etapas con observaciones
export interface RegistrarEtapaInput {
  orden_id: string | number;
  etapa: string;
  observaciones?: string; 
}

interface ApiResponse<T = unknown> {
  success:  boolean;
  error?:   string | null;
  message?: string | null;
  data?:    T;
}

export const ORDENES_KEY = 'ordenes-produccion';

// Hook para LISTAR y CONSULTAR ÓRDENES
export function useOrdenesProduccion(options?: { page?: number; limit?: number; search?: string; etapa?: string }) {
  const supabase = getSupabaseBrowserClient();
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const search = options?.search ?? '';
  const etapa = options?.etapa ?? 'all';

  const { data, isLoading, refetch } = useQuery({
    queryKey: [ORDENES_KEY, page, limit, search, etapa],
    queryFn: async () => {
      // 1. Obtenemos todas las órdenes con su producto relacionado y el seguimiento de producción más reciente
      const { data: todasLasOrdenes, error: errGlobal } = await supabase
        .from('ordenes_produccion')
        .select(`
          *,
          productos ( id, nombre ),
          seguimiento_produccion ( id, etapa, observaciones, fecha_registro )
        `);

      if (errGlobal) throw errGlobal;

      // 2. Mapeamos cada orden para determinar su etapa actual basada en el seguimiento más reciente
      const mapeadas = todasLasOrdenes?.map((orden: any) => {
        if (orden.seguimiento_produccion && orden.seguimiento_produccion.length > 0) {
          orden.seguimiento_produccion.sort(
            (a: any, b: any) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
          );
          orden.etapa_actual = orden.seguimiento_produccion[0].etapa;
        } else {
          orden.etapa_actual = 'diseno'; // Etapa inicial por defecto
        }
        return orden;
      }) || [];

      // 3. Calculamos las estadísticas descriptivas para las tarjetas superiores (Stats)
      const enProceso = mapeadas.filter((o: any) => o.etapa_actual !== 'listo_entrega').length;
      const completadas = mapeadas.filter((o: any) => o.etapa_actual === 'listo_entrega').length;

      // 4. Aplicamos los filtros de UI reactivos (Buscador por nombre de producto y Etapa seleccionada)
      let filtradas = mapeadas;
      if (search) {
        filtradas = filtradas.filter((o: any) => 
          o.productos?.nombre?.toLowerCase().includes(search.toLowerCase()) || 
          o.id.toString().includes(search)
        );
      }

      if (etapa !== 'all') {
        if (etapa === 'costura') {
          // Si tu app agrupa bajo "costura" las fases intermedias de taller
          filtradas = filtradas.filter((o: any) => ['corte', 'confeccion', 'remallado', 'bordado_estampado'].includes(o.etapa_actual));
        } else if (etapa === 'entrega') {
          filtradas = filtradas.filter((o: any) => o.etapa_actual === 'listo_entrega');
        } else {
          filtradas = filtradas.filter((o: any) => o.etapa_actual === etapa);
        }
      }

      // 5. Paginación manual en memoria para respetar los filtros globales y los contadores
      const totalRecords = filtradas.length;
      const totalPages = Math.ceil(totalRecords / limit);
      const desde = (page - 1) * limit;
      const paginadas = filtradas.slice(desde, desde + limit);

      return {
        ordenes: paginadas,
        meta: {
          total: totalRecords,
          page,
          limit,
          totalPages,
          enProceso,
          completadas
        }
      };
    },
    placeholderData: (previousData) => previousData,
  });

  return {
    ordenes: data?.ordenes || [],
    meta: data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1, enProceso: 0, completadas: 0 },
    isLoading,
    refetch,
  };
}

// Hook para Crear Ordenes
export function useCreateOrdenProduccion() {
  const queryClient = useQueryClient();

  const createMutation = useMutation<ApiResponse<unknown>, Error, CreateOrdenProduccionInput>({
    mutationFn: createOrdenProduccion,
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

  const etapaMutation = useMutation<ApiResponse<unknown>, Error, RegistrarEtapaInput>({
    mutationFn: async (payload) => {
      const supabase = getSupabaseBrowserClient();
      
      // ── CORRECCIÓN: Parseo estricto a Number y aserción de tipo para el ENUM de etapa ──
      const { error } = await supabase
        .from('seguimiento_produccion')
        .insert([{
          orden_id: Number(payload.orden_id),
          etapa: payload.etapa as "diseno" | "patronaje" | "corte" | "confeccion" | "remallado" | "bordado_estampado" | "control_calidad" | "acabado" | "listo_entrega",
          observaciones: payload.observaciones || ''
        }]);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? 'Error al registrar la nueva etapa');
        return;
      }
      toast.success('Etapa de producción actualizada');
      queryClient.invalidateQueries({ queryKey: [ORDENES_KEY] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Error de conexión al cambiar de etapa');
    },
  });

  return {
    create: (data: CreateOrdenProduccionInput) => createMutation.mutate(data),
    registrarEtapa: (data: RegistrarEtapaInput) => etapaMutation.mutate(data),
    isCreating: createMutation.isPending,
    isChangingEtapa: etapaMutation.isPending, 
  };
}

// Hook para Actualizar Ordenes
export function useUpdateOrdenProduccion() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation<ApiResponse<unknown>, Error, { id: string | number; data: CreateOrdenProduccionInput }>({
    mutationFn: async (payload) => {
      const supabase = getSupabaseBrowserClient();
      
      // ── CORRECCIÓN: Conversión de tipos y enteros requerida por types/database.ts ──
      const { error } = await supabase
        .from('ordenes_produccion')
        .update({
          producto_id: Number(payload.data.producto_id),
          taller_id: Number(payload.data.taller_id),
          ficha_id: Number(payload.data.ficha_id),
          cantidad_solicitada: payload.data.cantidad_solicitada,
          notas: payload.data.notes
        })
        .eq('id', Number(payload.id));

      if (error) throw error;
      return { success: true };
    },
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
    update: (id: string | number, data: CreateOrdenProduccionInput) => updateMutation.mutate({ id, data }),
    isUpdating: updateMutation.isPending,
  };
}