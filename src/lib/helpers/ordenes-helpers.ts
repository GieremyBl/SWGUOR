import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Orden = Database['public']['Tables']['ordenes']['Row'];
type OrdenInsert = Database['public']['Tables']['ordenes']['Insert'];
type EstadoOrden = Database['public']['Enums']['EstadoOrden'];
type MetodoPago = Database['public']['Enums']['MetodoPago'];

/**
 * Obtiene órdenes con filtros opcionales y relación con clientes
 */
export const obtenerOrdenes = async (filtros?: { estado?: EstadoOrden }) => {
  const supabase = await createClient();
  let query = supabase
    .from('ordenes')
    .select('*, clientes(razon_social, ruc)');

  if (filtros?.estado) {
    query = query.eq('estado', filtros.estado);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  return { 
    data: data as any[], 
    error: error ? error.message : null 
  };
};

/**
 * Crea una orden y sus detalles (Lógica simplificada)
 */
export const crearOrden = async (
  ordenData: Omit<OrdenInsert, 'subtotal' | 'impuestos' | 'total'>,
  detalles: any[]
) => {
  const supabase = await createClient();
  
  // Aquí normalmente calcularías totales antes de insertar
  const { data, error } = await supabase
    .from('ordenes')
    .insert([{ ...ordenData, total: 0 }]) // Ajustar según lógica de negocio
    .select()
    .single();

  return { data, error: error ? error.message : null };
};

/**
 * Cambia el estado y actualiza datos de pago
 */
export const cambiarEstadoOrden = async (
  ordenId: string,
  nuevoEstado: EstadoOrden,
  dataExtra?: { metodo_pago?: MetodoPago; payment_id?: string }
) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from('ordenes')
    .update({ 
      estado: nuevoEstado,
      ...dataExtra 
    })
    .eq('id', Number(ordenId));

  return { 
    success: !error, 
    error: error ? error.message : null 
  };
};

/**
 * Verifica stock disponible para una lista de productos
 */
export const verificarStock = async (items: Array<{ producto_id: number; cantidad: number }>) => {
  const supabase = await createClient();
  
  // Simulación de verificación (debes implementar la lógica según tu tabla productos)
  return {
    disponible: true,
    faltantes: []
  };
};