"use client";

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // IMPORTANTE: Cliente de navegador
import {
  obtenerInsumos,
  crearInsumo,
  actualizarStockFisico,
} from '@/lib/helpers/productos-helpers';
import type { Database } from '@/types/database';

type Insumo = Database['public']['Tables']['insumo']['Row'];
type InsumoInsert = Database['public']['Tables']['insumo']['Insert'];
type TipoInsumo = Database['public']['Enums']['TipoInsumo'];

interface UseInventarioState {
  insumos: Insumo[];
  inventarioActual: Insumo | null;
  productosAgotados: Insumo[];
  productosStockBajo: Insumo[];
  cargando: boolean;
  error: string | null;
}

/**
 * Hook para gestionar inventario desde el Cliente
 */
export function useInventario() {
  const [state, setState] = useState<UseInventarioState>({
    insumos: [],
    inventarioActual: null,
    productosAgotados: [],
    productosStockBajo: [],
    cargando: false,
    error: null
  });

  const supabase = createClient(); // Inicializamos el cliente una vez

  const obtenerInsumosList = useCallback(async (tipo?: TipoInsumo) => {
    setState(prev => ({ ...prev, cargando: true, error: null }));
    try {
      // Pasamos 'supabase' como primer argumento
      const data = await obtenerInsumos(supabase); 
      
      setState(prev => ({
        ...prev,
        insumos: data || [],
        cargando: false
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, cargando: false }));
    }
  }, [supabase]);

  const crearInsumoNuevo = useCallback(async (insumoData: InsumoInsert) => {
    setState(prev => ({ ...prev, cargando: true, error: null }));
    try {
      const data = await crearInsumo(supabase, insumoData);

      setState(prev => ({
        ...prev,
        insumos: [data as Insumo, ...prev.insumos],
        cargando: false
      }));
      return true;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, cargando: false }));
      return false;
    }
  }, [supabase]);

  const actualizarStock = useCallback(async (id: number, cantidad: number, operacion: 'sumar' | 'restar') => {
    setState(prev => ({ ...prev, cargando: true, error: null }));
    try {
      const data = await actualizarStockFisico(supabase, id, cantidad, operacion);

      if (!data) throw new Error("No se pudo actualizar el stock");

      // Actualizar estado local
      setState(prev => ({
        ...prev,
        insumos: prev.insumos.map(i => i.id === id ? data : i),
        cargando: false
      }));
      return true;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, cargando: false }));
      return false;
    }
  }, [supabase]);

  const obtenerBajoStock = useCallback(async () => {
    setState(prev => ({ ...prev, cargando: true, error: null }));
    try {
      // Nota: Si no tienes esta función en el helper, 
      // puedes filtrar los 'insumos' locales o crearla.
      const data = await obtenerInsumos(supabase);
      const bajoStock = data.filter(i => i.stock_actual <= (i.stock_minimo || 5));

      setState(prev => ({
        ...prev,
        productosStockBajo: bajoStock,
        cargando: false
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, cargando: false }));
    }
  }, [supabase]);

  const limpiar = useCallback(() => {
    setState({
      insumos: [],
      inventarioActual: null,
      productosAgotados: [],
      productosStockBajo: [],
      cargando: false,
      error: null
    });
  }, []);

  return {
    ...state,
    obtenerInsumosList,
    crearInsumoNuevo,
    actualizarStock,
    obtenerBajoStock,
    limpiar
  };
}