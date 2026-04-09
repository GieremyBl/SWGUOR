/**
 * Hook personalizado para manejar órdenes
 * Proporciona funciones para obtener, crear, actualizar y gestionar órdenes
 */

import { useCallback, useState } from 'react';
// CORRECCIÓN: Se importan todas las funciones necesarias del helper correcto
import { 
  obtenerOrdenes, 
  crearOrden, 
  cambiarEstadoOrden, 
  verificarStock 
} from '@/lib/helpers/ordenes-helpers';
import type { Database } from '@/types/database';

type Orden = Database['public']['Tables']['ordenes']['Row'];
type OrdenInsert = Database['public']['Tables']['ordenes']['Insert'];
type EstadoOrden = Database['public']['Enums']['EstadoOrden'];
type MetodoPago = Database['public']['Enums']['MetodoPago'];

// Tipos locales para el estado del hook
interface FiltrosOrden {
  estado?: EstadoOrden;
  fecha_desde?: string;
  fecha_hasta?: string;
}

type OrdenCompleta = Orden & {
  detalles?: any[];
  clientes?: { razon_social: string; ruc?: string | null } | null;
};

interface VerificacionStock {
  disponible: boolean;
  faltantes: Array<{
    producto_id: number;
    nombre: string;
    requerido: number;
    disponible: number;
    faltante: number;
  }>;
}

interface UseOrdenesState {
  ordenes: OrdenCompleta[];
  cargando: boolean;
  error: string | null;
}

interface UseOrdenesActions {
  obtener: (filtros?: FiltrosOrden) => Promise<void>;
  crear: (
    ordenData: Omit<OrdenInsert, 'subtotal' | 'impuestos' | 'total'>,
    detalles: any[]
  ) => Promise<boolean>;
  cambiarEstado: (
    ordenId: string,
    nuevoEstado: EstadoOrden,
    dataExtra?: { metodo_pago?: MetodoPago; payment_id?: string }
  ) => Promise<boolean>;
  verificarStockDisponible: (items: Array<{ producto_id: number; cantidad: number }>) => Promise<VerificacionStock>;
  limpiar: () => void;
}

/**
 * Hook para gestionar órdenes
 */
export function useOrdenes(): UseOrdenesState & UseOrdenesActions {
  const [state, setState] = useState<UseOrdenesState>({
    ordenes: [],
    cargando: false,
    error: null
  });

  const obtener = useCallback(async (filtros?: FiltrosOrden) => {
    setState(prev => ({ ...prev, cargando: true, error: null }));
    try {
      // Llamada al helper corregida
      const { data, error } = await obtenerOrdenes(filtros);

      if (error) {
        setState(prev => ({ ...prev, error, cargando: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        ordenes: (data as OrdenCompleta[]) || [],
        cargando: false
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Error obteniendo órdenes',
        cargando: false
      }));
    }
  }, []);

  const crear = useCallback(
    async (
      ordenData: Omit<OrdenInsert, 'subtotal' | 'impuestos' | 'total'>,
      detalles: any[]
    ) => {
      setState(prev => ({ ...prev, cargando: true, error: null }));
      try {
        const { error } = await crearOrden(ordenData, detalles);

        if (error) {
          setState(prev => ({ ...prev, error, cargando: false }));
          return false;
        }

        await obtener();
        return true;
      } catch (err: any) {
        setState(prev => ({
          ...prev,
          error: err.message || 'Error creando orden',
          cargando: false
        }));
        return false;
      }
    },
    [obtener]
  );

  const cambiarEstado = useCallback(
    async (
      ordenId: string,
      nuevoEstado: EstadoOrden,
      dataExtra?: { metodo_pago?: MetodoPago; payment_id?: string }
    ) => {
      setState(prev => ({ ...prev, cargando: true, error: null }));
      try {
        const { success, error } = await cambiarEstadoOrden(ordenId, nuevoEstado, dataExtra);

        if (error || !success) {
          setState(prev => ({
            ...prev,
            error: error || 'Error cambiando estado',
            cargando: false
          }));
          return false;
        }

        // Actualización optimista del estado local
        setState(prev => ({
          ...prev,
          ordenes: prev.ordenes.map((o: OrdenCompleta) =>
            o.id === Number(ordenId) ? { ...o, estado: nuevoEstado, ...dataExtra } : o
          ),
          cargando: false
        }));

        return true;
      } catch (err: any) {
        setState(prev => ({
          ...prev,
          error: err.message || 'Error cambiando estado',
          cargando: false
        }));
        return false;
      }
    },
    []
  );

  const verificarStockDisponible = useCallback(
    async (items: Array<{ producto_id: number; cantidad: number }>) => {
      try {
        return await verificarStock(items);
      } catch (err: any) {
        setState(prev => ({
          ...prev,
          error: err.message || 'Error verificando stock'
        }));
        return { disponible: false, faltantes: [] };
      }
    },
    []
  );

  const limpiar = useCallback(() => {
    setState({
      ordenes: [],
      cargando: false,
      error: null
    });
  }, []);

  return {
    ...state,
    obtener,
    crear,
    cambiarEstado,
    verificarStockDisponible,
    limpiar
  };
}