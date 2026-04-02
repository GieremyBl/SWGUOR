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

export async function crearProducto(supabase: SupabaseClient, datos: any) {
  return await supabase
    .from('productos')
    .insert([datos])
    .select()
    .single();
}

/**
 * PRODUCTOS DEL PORTAL (Venta B2B)
 * Ajustado a los nombres de columna de tu SQL: 'precio' y 'stock'
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
    .eq('estado', 'activo' as EstadoProducto); // En tu SQL usas 'estado' no 'activo' (boolean)

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
 * IMPORTANTE: Tu tabla SQL se llama 'insumo' (singular)
 */
export const obtenerInsumos = async (supabase: SupabaseClient): Promise<Insumo[]> => {
  const { data, error } = await supabase
    .from('insumo') // Corregido a singular según tu esquema
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Insumo[];
};

export const crearInsumo = async (supabase: SupabaseClient, insumo: InsumoInsert) => {
  const { data, error } = await supabase
    .from('insumo') // Corregido a singular
    .insert([insumo])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * ACTUALIZAR STOCK FÍSICO (Insumos)
 * Corregido para usar la columna 'stock_actual' de tu tabla 'insumo'
 */
export const actualizarStockFisicoInsumo = async (
  supabase: SupabaseClient, 
  id: number, 
  cantidad: number, 
  operacion: 'sumar' | 'restar'
) => {
  // 1. Obtenemos el stock actual
  const { data: insumo, error: fetchError } = await supabase
    .from('insumo')
    .select('stock_actual')
    .eq('id', id)
    .single();

  if (fetchError || !insumo) throw new Error("Insumo no encontrado");

  // 2. Calculamos nuevo stock
  const nuevoStock = operacion === 'sumar' 
    ? insumo.stock_actual + cantidad 
    : insumo.stock_actual - cantidad;

  // 3. Actualizamos
  const { data, error } = await supabase
    .from('insumo')
    .update({ stock_actual: nuevoStock })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
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