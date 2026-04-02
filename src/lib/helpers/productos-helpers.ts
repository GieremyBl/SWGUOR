import { SupabaseClient } from '@supabase/supabase-js';
import type { ProductoPortal, Insumo, InsumoInsert, EstadoProducto } from '@/types';

/**
 * PRODUCTOS (Panel Administrativo & API)
 */
export async function obtenerProductos(supabase: SupabaseClient, filtros?: any) {
  let query = supabase
    .from('productos')
    .select(`
      *,
      categorias (nombre)
    `);

  // Uso de casteo para evitar errores de tipos en Enums
  if (filtros?.categoria_id) query = query.eq('categoria_id', filtros.categoria_id);
  if (filtros?.estado) query = query.eq('estado', filtros.estado as EstadoProducto);
  if (filtros?.busqueda) query = query.ilike('nombre', `%${filtros.busqueda}%`);

  return await query.order('created_at', { ascending: false });
}

/**
 * CREAR PRODUCTO (Panel Administrativo & API)
 */

export async function crearProducto(supabase: SupabaseClient, datos: any) {
  return await supabase
    .from('productos')
    .insert([datos])
    .select()
    .single();
}

/**
 * ACTUALIZAR PRODUCTO (Panel Administrativo & API)
 */
export async function actualizarProducto(supabase: SupabaseClient, id: number, datos: any) {
  return await supabase
    .from('productos')
    .update(datos)
    .eq('id', id)
    .select()
    .single();
}

/*
  * ELIMINAR PRODUCTO (Panel Administrativo & API)
  */
export async function eliminarProducto(supabase: SupabaseClient, id: number) {
  return await supabase
    .from('productos')
    .delete()
    .eq('id', id);
}

/**
 * PRODUCTOS DEL PORTAL (Venta B2B)
 */
export const obtenerProductosPortal = async (supabase: SupabaseClient): Promise<ProductoPortal[]> => {
  const { data, error } = await supabase
    .from('productos')
    .select(`
      id,
      nombre,
      sku,
      precio,
      stock,
      categorias (nombre)
    `)
    .eq('estado', 'activo' as EstadoProducto);

  if (error) {
    console.error('Error al obtener productos portal:', error);
    return [];
  }

  return data.map((p: any) => ({
    id: p.id.toString(),
    nombre: p.nombre,
    sku: p.sku,
    precioBase: p.precio,
    stockActual: p.stock,
    categoria: p.categorias?.nombre || 'General'
  }));
};

/**
 * INSUMOS (Materia Prima / Taller)
 */
export const obtenerInsumos = async (supabase: SupabaseClient): Promise<Insumo[]> => {
  const { data, error } = await supabase
    .from('insumo')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Insumo[];
};

export const crearInsumo = async (supabase: SupabaseClient, insumo: InsumoInsert) => {
  const { data, error } = await supabase
    .from('insumo')
    .insert([insumo])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * ACTUALIZAR STOCK FÍSICO (Insumos)
 */
export const actualizarStockFisicoInsumo = async (
  supabase: SupabaseClient, 
  id: number, 
  valor: number,
  operacion: 'set' | 'sumar' | 'restar' = 'set'
) => {
  let nuevoStock = valor;

  if (operacion !== 'set') {
    const { data: insumo } = await supabase
      .from('insumo')
      .select('stock_actual')
      .eq('id', id)
      .single();
    
    if (!insumo) throw new Error("Insumo no encontrado");
    nuevoStock = operacion === 'sumar' ? insumo.stock_actual + valor : insumo.stock_actual - valor;
  }

  const { data, error } = await supabase
    .from('insumo')
    .update({ stock_actual: nuevoStock })
    .eq('id', id)
    .select()
    .single();

  return { success: !error, data, error: error?.message || null };
};

/**
 * UTILITARIOS
 */
export function calcularMargen(costo: number, precio: number) {
  if (!costo || !precio || precio === 0) return 0;
  return parseFloat((((precio - costo) / precio) * 100).toFixed(2));
}

/**
 * Formateador de moneda para la UI
 */
export const formatearMoneda = (cantidad: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(cantidad);
};