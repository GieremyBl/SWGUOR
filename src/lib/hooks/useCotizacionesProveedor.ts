'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchCotizacionesProveedor,
  fetchCotizacionProveedorDetalle,
  crearCotizacionProveedor,
  actualizarCotizacionProveedor,
  cambiarEstadoCotizacionProveedor,
  anularCotizacionProveedor,
  subirPdfCotizacionProveedor,
} from '@/lib/helpers/cotizaciones-proveedor-helpers';
import type {
  ActualizarCotizacionProveedorInput,
  CrearCotizacionProveedorInput,
} from '@/lib/schemas/cotizaciones-proveedor';
import type { 
  CotizacionRow, 
  CotizacionDetalleData, 
  PaginatedApiResponse, 
  ApiResponse 
} from '@/types/cotizacion-proveedor'; // Ajusta la ruta si las pones en otro archivo

export const COTIZACIONES_PROVEEDOR_KEY = 'cotizaciones-proveedor';

interface ListOpts {
  page: number;
  limit: number;
  busqueda: string;
  estadoFilter: string;
}

export function useCotizacionesProveedorList(opts: ListOpts) {
  const qc = useQueryClient();

  // Forzamos a useQuery a saber que la función retorna un PaginatedApiResponse<CotizacionRow>
  const query = useQuery<PaginatedApiResponse<CotizacionRow>>({
    queryKey: [COTIZACIONES_PROVEEDOR_KEY, opts.page, opts.busqueda, opts.estadoFilter],
    queryFn: () =>
      fetchCotizacionesProveedor(opts.page, opts.limit, opts.busqueda, opts.estadoFilter) as Promise<PaginatedApiResponse<CotizacionRow>>,
    refetchOnWindowFocus: false,
  });

  const cambiarEstadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: string | number; estado: string }) =>
      cambiarEstadoCotizacionProveedor(id, estado),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'No se pudo cambiar el estado');
        return;
      }
      toast.success('Estado actualizado');
      qc.invalidateQueries({ queryKey: [COTIZACIONES_PROVEEDOR_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  const anularMut = useMutation({
    mutationFn: anularCotizacionProveedor,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'No se pudo anular');
        return;
      }
      toast.success(res.message || 'Cotización anulada');
      qc.invalidateQueries({ queryKey: [COTIZACIONES_PROVEEDOR_KEY] });
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    // Si data no existe, devolvemos un array vacío seguro con el tipo correcto
    items: query.data?.data ?? ([] as CotizacionRow[]),
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    refetch: query.refetch,
    cambiarEstado: (id: string | number, estado: string) =>
      cambiarEstadoMut.mutate({ id, estado }),
    anular: (id: string | number) => anularMut.mutate(id),
    isChangingEstado: cambiarEstadoMut.isPending,
    isAnulando: anularMut.isPending,
  };
}

export function useCotizacionProveedorDetalle(id: string | null) {
  // Indicamos que useQuery resolverá una promesa de tipo ApiResponse<CotizacionDetalleData>
  return useQuery<ApiResponse<CotizacionDetalleData>>({
    queryKey: [COTIZACIONES_PROVEEDOR_KEY, id],
    queryFn: () => 
      fetchCotizacionProveedorDetalle(id!) as Promise<ApiResponse<CotizacionDetalleData>>,
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });
}

export function useCotizacionProveedorDetalleAcciones(id: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [COTIZACIONES_PROVEEDOR_KEY, id] });
    qc.invalidateQueries({ queryKey: [COTIZACIONES_PROVEEDOR_KEY] });
  };

  const cambiarEstadoMut = useMutation({
    mutationFn: (estado: string) => cambiarEstadoCotizacionProveedor(id, estado),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'No se pudo cambiar el estado');
        return;
      }
      toast.success('Estado actualizado');
      invalidate();
    },
    onError: () => toast.error('Error de conexión'),
  });

  const anularMut = useMutation({
    mutationFn: () => anularCotizacionProveedor(id),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error || 'No se pudo anular');
        return;
      }
      toast.success(res.message || 'Cotización anulada');
      invalidate();
    },
    onError: () => toast.error('Error de conexión'),
  });

  return {
    cambiarEstado: (estado: string) => cambiarEstadoMut.mutate(estado),
    anular: () => {
      if (!confirm('¿Anular esta cotización?')) return;
      anularMut.mutate();
    },
    isChangingEstado: cambiarEstadoMut.isPending || anularMut.isPending,
  };
}

export function useCotizacionProveedorMutations() {
  const qc = useQueryClient();

  const crearMut = useMutation({
    mutationFn: crearCotizacionProveedor,
    onSuccess: (res) => {
      if (!res.success) throw new Error(res.error || 'Error al crear');
      qc.invalidateQueries({ queryKey: [COTIZACIONES_PROVEEDOR_KEY] });
    },
  });

  const actualizarMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: ActualizarCotizacionProveedorInput;
    }) => actualizarCotizacionProveedor(id, data),
    onSuccess: (res) => {
      if (!res.success) throw new Error(res.error || 'Error al actualizar');
      qc.invalidateQueries({ queryKey: [COTIZACIONES_PROVEEDOR_KEY] });
    },
  });

  const subirPdfMut = useMutation({
    mutationFn: ({ id, file }: { id: string | number; file: File }) =>
      subirPdfCotizacionProveedor(id, file),
    onSuccess: (res) => {
      if (!res.success) throw new Error(res.error || 'Error al subir PDF');
      qc.invalidateQueries({ queryKey: [COTIZACIONES_PROVEEDOR_KEY] });
    },
  });

  return {
    crear: (data: CrearCotizacionProveedorInput) => crearMut.mutateAsync(data),
    actualizar: (id: string | number, data: ActualizarCotizacionProveedorInput) =>
      actualizarMut.mutateAsync({ id, data }),
    subirPdf: (id: string | number, file: File) => subirPdfMut.mutateAsync({ id, file }),
    isSaving: crearMut.isPending || actualizarMut.isPending,
    isUploadingPdf: subirPdfMut.isPending,
  };
}