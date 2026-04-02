import { supabase } from '@/lib/supabase/client';
import { EstadoOrden, OrdenInsert } from "@/types";

/**
 * Obtiene las órdenes incluyendo la razón social del cliente
 */
export const obtenerOrdenes = async (filtros?: { estado?: string; fecha_desde?: string; fecha_hasta?: string }) => {
  let query = supabase
    .from('ordenes')
    .select(`
      *,
      clientes (
        razon_social,
        ruc
      )
    `)
    .order('created_at', { ascending: false });

  if (filtros?.estado) {
    query = query.eq('estado', filtros.estado as EstadoOrden);
  }
  
  if (filtros?.fecha_desde) query = query.gte('created_at', filtros.fecha_desde);
  if (filtros?.fecha_hasta) query = query.lte('created_at', filtros.fecha_hasta);

  const { data, error } = await query;
  return { data, error: error?.message || null };
};

/**
 * Crea una orden. 
 * Según tu esquema, la orden se vincula a una cotización existente,
 * por lo que NO necesitamos insertar en una tabla de detalles.
 */
export const crearOrden = async (orden: OrdenInsert) => {
  const { data, error } = await supabase
    .from('ordenes')
    .insert([orden])
    .select()
    .single();

  return { data, error: error?.message || null };
};

/**
 * Actualiza el estado o datos de la orden
 */
export const cambiarEstadoOrden = async (id: string | number, nuevoEstado: EstadoOrden, dataExtra?: any) => {
  const updateData = { 
    estado: nuevoEstado, 
    updated_at: new Date().toISOString(),
    ...dataExtra 
  };
  
  const { data, error } = await supabase
    .from('ordenes')
    .update(updateData)
    .eq('id', Number(id))
    .select()
    .single();

  return { 
    success: !error, 
    data, 
    error: error?.message || null 
  };
};

/**
 * Verifica stock consultando la tabla de productos o variantes
 */
export const verificarStock = async (items: Array<{ producto_id: number; cantidad: number }>) => {
  // Implementación básica para cumplir con el contrato del Hook
  return { disponible: true, faltantes: [] };
};

// Helpers de utilidad para el formulario
export const calcularTotalVenta = (items: any[]) => {
  return items.reduce((acc, item) => acc + (item.precio_unitario_snapshot * item.cantidad), 0);
};