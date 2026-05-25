'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchReglasDescuento,
  fetchReglasActivas,
  saveReglaDescuento,
  deactivateReglaDescuento,
  fetchPromociones,
  savePromocion,
  deactivatePromocion,
  fetchOfertas,
  saveOferta,
  deactivateOferta,
} from '@/lib/helpers/promociones-helpers';
import type { CampanaForm, ReglaDescuentoForm } from '@/lib/schemas/promociones-ofertas';

export const REGLAS_KEY = 'reglas-descuento';
export const PROMOCIONES_KEY = 'promociones';
export const OFERTAS_KEY = 'ofertas';

interface ListOpts {
  page: number;
  limit: number;
  busqueda: string;
  activoFilter: string;
  enabled?: boolean;
}

export function useReglasDescuento(opts: ListOpts & { editingId?: string | number | null }) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [REGLAS_KEY, opts.page, opts.busqueda, opts.activoFilter],
    queryFn: () =>
      fetchReglasDescuento(opts.page, opts.limit, opts.busqueda, opts.activoFilter),
    refetchOnWindowFocus: false,
    enabled: opts.enabled !== false,
  });

  const saveMut = useMutation({
    mutationFn: saveReglaDescuento,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al guardar');
        return;
      }
      toast.success(opts.editingId ? 'Regla actualizada' : 'Regla creada');
      qc.invalidateQueries({ queryKey: [REGLAS_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const deactivateMut = useMutation({
    mutationFn: deactivateReglaDescuento,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al desactivar');
        return;
      }
      toast.success(res.message || 'Regla desactivada');
      qc.invalidateQueries({ queryKey: [REGLAS_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    items: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    refetch: query.refetch,
    save: (data: ReglaDescuentoForm) => saveMut.mutate(data),
    deactivate: (id: string | number) => deactivateMut.mutate(id),
    isSaving: saveMut.isPending,
    isDeactivating: deactivateMut.isPending,
  };
}

export function useReglasActivasPicker() {
  return useQuery({
    queryKey: [REGLAS_KEY, 'activas'],
    queryFn: fetchReglasActivas,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
}

function useCampanas(
  key: string,
  fetchFn: typeof fetchPromociones,
  saveFn: typeof savePromocion,
  deactivateFn: typeof deactivatePromocion,
  opts: ListOpts & { editingId?: string | number | null; label: string },
) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [key, opts.page, opts.busqueda, opts.activoFilter],
    queryFn: () => fetchFn(opts.page, opts.limit, opts.busqueda, opts.activoFilter),
    refetchOnWindowFocus: false,
    enabled: opts.enabled !== false,
  });

  const saveMut = useMutation({
    mutationFn: saveFn,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al guardar');
        return;
      }
      toast.success(opts.editingId ? `${opts.label} actualizada` : `${opts.label} creada`);
      qc.invalidateQueries({ queryKey: [key] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const deactivateMut = useMutation({
    mutationFn: deactivateFn,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'Error al desactivar');
        return;
      }
      toast.success(res.message || `${opts.label} desactivada`);
      qc.invalidateQueries({ queryKey: [key] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    items: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    refetch: query.refetch,
    save: (data: CampanaForm) => saveMut.mutate(data),
    deactivate: (id: string | number) => deactivateMut.mutate(id),
    isSaving: saveMut.isPending,
    isDeactivating: deactivateMut.isPending,
  };
}

export function usePromociones(
  opts: ListOpts & { editingId?: string | number | null },
) {
  return useCampanas(
    PROMOCIONES_KEY,
    fetchPromociones,
    savePromocion,
    deactivatePromocion,
    { ...opts, label: 'Promoción' },
  );
}

export function useOfertas(opts: ListOpts & { editingId?: string | number | null }) {
  return useCampanas(OFERTAS_KEY, fetchOfertas, saveOferta, deactivateOferta, {
    ...opts,
    label: 'Oferta',
  });
}
