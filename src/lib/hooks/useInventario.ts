"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchInsumos,
  fetchInsumoById,
  createInsumo,
  updateInsumo,
  ajustarStock,
  deleteInsumo,
  fetchMovimientos,
} from "@/lib/helpers/inventario-helpers";

export const INVENTARIO_KEY = "inventario";
export const MOVIMIENTOS_KEY = "movimientos_inventario";

// ── Interfaces del Dominio de Inventario Textil ───────────────────────────────

export interface Insumo {
  id:              string;
  nombre:          string;
  tipo:            string; // Ej: 'MATERIA_PRIMA', 'CONFECCIONADO'
  categoria?:      string; // Ej: 'TELAS', 'BOTONES', 'CIERRES'
  stock_actual:    number;
  stock_minimo?:   number;
  costo_unitario?: number;
  precio_unitario?: number;
  [key: string]:   unknown;
}

export interface Proveedor {
  id:             string;
  razon_social:   string;
  ruc?:           string;
  [key: string]:  unknown;
}

export interface MovimientoInventario {
  id:              string;
  insumo_id?:      string;
  cantidad:        number;
  operacion:       "sumar" | "restar" | "absoluto";
  motivo?:         string;
  costo_unitario?: number;
  precio_unitario?: number;
  createdAt:       string;
  [key: string]:   unknown;
}

// Interfaces estrictas para las respuestas compuestas de tus helpers de la API
export interface InsumosQueryResponse {
  insumos: Insumo[];
  proveedores: Proveedor[];
}

export interface MovimientosQueryResponse {
  movimientos: MovimientoInventario[];
}

export interface ApiResponse<T = unknown> {
  success:  boolean;
  error?:   string | null;
  message?: string | null;
  data?:    T;
}

// Parámetros de filtros de entrada
export interface UseInventarioParams {
  tipo?:              string;
  categoria?:         string;
  busqueda?:          string;
  stockBajo?:         boolean;
  sortOrder?:         "asc" | "desc" | "none";
  limiteMovimientos?: number;
}

export interface AjustarStockInput {
  id:               string;
  cantidad:         number;
  operacion:        "sumar" | "restar" | "absoluto";
  costo_unitario?:  number;
  precio_unitario?: number;
  motivo?:          string;
}

export interface UseMovimientosParams {
  insumoId?: string;
  desde?:    string;
  hasta?:    string;
  limite?:   number;
}

// ── LISTA DE INSUMOS ──────────────────────────────────────────────────────────

export function useInventario(params?: UseInventarioParams) {
  const queryClient = useQueryClient();
  const { tipo, categoria, busqueda, stockBajo, sortOrder, limiteMovimientos } = params ?? {};

  // useQuery fuertemente tipado para insumos y proveedores concurrentes
  const query = useQuery<InsumosQueryResponse, Error>({
    queryKey: [INVENTARIO_KEY, { tipo, categoria, busqueda, stockBajo, sortOrder }],
    queryFn:  async () => {
      const res = await fetchInsumos({ tipo, categoria, busqueda, stockBajo, sortOrder });
      return res as unknown as InsumosQueryResponse;
    },
    refetchOnWindowFocus: false,
  });

  // useQuery fuertemente tipado para el lote corto de movimientos
  const movimientosQuery = useQuery<MovimientosQueryResponse, Error>({
    queryKey: [MOVIMIENTOS_KEY, { limite: limiteMovimientos }],
    queryFn:  async () => {
      const res = await fetchMovimientos({ limite: limiteMovimientos });
      return res as unknown as MovimientosQueryResponse;
    },
    refetchOnWindowFocus: false,
  });

  // ── Crear ────────────────────────────────────────────────────────────────────
  const createMutation = useMutation<ApiResponse, Error, Record<string, unknown>>({
    mutationFn: createInsumo,
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? "Error al crear"); return; }
      toast.success("Insumo creado");
      queryClient.invalidateQueries({ queryKey: [INVENTARIO_KEY] });
    },
    onError: () => toast.error("Error de conexión"),
  });

  // ── Actualizar ───────────────────────────────────────────────────────────────
  const updateMutation = useMutation<ApiResponse, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => updateInsumo(id, data),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? "Error al actualizar"); return; }
      toast.success("Insumo actualizado");
      queryClient.invalidateQueries({ queryKey: [INVENTARIO_KEY] });
    },
    onError: () => toast.error("Error de conexión"),
  });

  // ── Ajustar Stock ────────────────────────────────────────────────────────────
  const ajustarStockMutation = useMutation<ApiResponse, Error, AjustarStockInput>({
    mutationFn: ({
      id,
      cantidad,
      operacion,
      costo_unitario,
      precio_unitario,
      motivo,
    }) =>
      ajustarStock(id, {
        operacion,
        cantidad,
        costo_unitario,
        precio_unitario,
        motivo: motivo ?? (operacion === "absoluto" ? "Ajuste manual de stock" : undefined),
      }),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? "Error al ajustar stock"); return; }
      toast.success("Inventario y precios actualizados");
      queryClient.invalidateQueries({ queryKey: [INVENTARIO_KEY] });
      queryClient.invalidateQueries({ queryKey: [MOVIMIENTOS_KEY] });
    },
    onError: () => toast.error("Error de conexión"),
  });

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation<ApiResponse, Error, string>({
    mutationFn: deleteInsumo,
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.error ?? "Error al eliminar"); return; }
      toast.success("Insumo eliminado");
      queryClient.invalidateQueries({ queryKey: [INVENTARIO_KEY] });
    },
    onError: () => toast.error("Error de conexión"),
  });

  return {
    insumos:     query.data?.insumos     ?? [],
    proveedores: query.data?.proveedores ?? [],
    movimientos: movimientosQuery.data?.movimientos ?? [],
    isLoading:   query.isLoading,
    refetch:     () => {
      query.refetch();
      movimientosQuery.refetch();
    },

    // Retornos booleanos asíncronos limpios y tipados para flujos interactivos de la UI
    create: (data: Record<string, unknown>): Promise<boolean> =>
      createMutation.mutateAsync(data).then(r => r.success),

    update: (id: string, data: Record<string, unknown>): Promise<boolean> =>
      updateMutation.mutateAsync({ id, data }).then(r => r.success),

    ajustarStock: (params: AjustarStockInput): Promise<boolean> => 
      ajustarStockMutation.mutateAsync(params).then(r => r.success),

    remove: (id: string): Promise<boolean> =>
      deleteMutation.mutateAsync(id).then(r => r.success),

    isCreating:       createMutation.isPending,
    isUpdating:       updateMutation.isPending,
    isAjustandoStock: ajustarStockMutation.isPending,
    isDeleting:       deleteMutation.isPending,

    cargando:           query.isLoading || movimientosQuery.isLoading,
    error:              query.error,
    obtenerInsumosList: query.refetch,
    limpiar:            () => {
      queryClient.removeQueries({ queryKey: [INVENTARIO_KEY] });
      queryClient.removeQueries({ queryKey: [MOVIMIENTOS_KEY] });
    },
  };
}

// ── INSUMO INDIVIDUAL ─────────────────────────────────────────────────────────

export function useInsumo(id: string) {
  return useQuery<Insumo, Error>({
    queryKey: [INVENTARIO_KEY, id],
    queryFn:  async () => {
      const res = await fetchInsumoById(id);
      return res as unknown as Insumo;
    },
    enabled:  !!id,
    refetchOnWindowFocus: false,
  });
}

// ── HISTORIAL DE MOVIMIENTOS ──────────────────────────────────────────────────

export function useMovimientos(params?: UseMovimientosParams) {
  const { insumoId, desde, hasta, limite } = params ?? {};

  return useQuery<MovimientosQueryResponse, Error>({
    queryKey: [MOVIMIENTOS_KEY, { insumoId, desde, hasta, limite }],
    queryFn:  async () => {
      const res = await fetchMovimientos({ insumoId, desde, hasta, limite });
      return res as unknown as MovimientosQueryResponse;
    },
    refetchOnWindowFocus: false,
  });
}