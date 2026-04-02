import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Obtiene una cotización completa con sus ítems
 */
export async function obtenerCotizacionPorId(supabase: SupabaseClient, id: number) {
  const { data, error } = await supabase
    .from('cotizaciones')
    .select(`
      *,
      clientes (razon_social, ruc, email),
      cotizacion_items (
        *,
        productos (nombre, sku),
        variantes_producto (nombre, color, talla)
      )
    `)
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Crea una cotización y sus ítems en una sola operación lógica
 */
export async function guardarCotizacionCompleta(
  supabase: SupabaseClient, 
  cotizacion: any, 
  items: any[]
) {
  // 1. Insertar la cabecera de la cotización
  const { data: nuevaCotizacion, error: errorCot } = await supabase
    .from('cotizaciones')
    .insert([cotizacion])
    .select()
    .single();

  if (errorCot) throw new Error(`Error cabecera: ${errorCot.message}`);

  // 2. Preparar los ítems con el ID generado
  const itemsConId = items.map(item => ({
    cotizacion_id: nuevaCotizacion.id,
    producto_id: item.producto_id,
    variante_id: item.variante_id || null,
    cantidad: item.cantidad,
    precio_unitario_snapshot: item.precio_unitario,
    subtotal: item.cantidad * item.precio_unitario
  }));

  // 3. Insertar los ítems
  const { error: errorItems } = await supabase
    .from('cotizacion_items')
    .insert(itemsConId);

  if (errorItems) {
    // Nota: En un entorno ideal usarías una RPC de Supabase para transacciones reales,
    // pero para este flujo, si falla, lanzamos el error para el catch de la API.
    throw new Error(`Error ítems: ${errorItems.message}`);
  }

  return nuevaCotizacion;
}

/**
 * Actualiza el estado de una cotización (ej. de 'borrador' a 'aprobada')
 */
export async function actualizarEstadoCotizacion(
  supabase: SupabaseClient, 
  id: number, 
  nuevoEstado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'convertida'
) {
  return await supabase
    .from('cotizaciones')
    .update({ 
      estado: nuevoEstado,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();
}

/**
 * Genera el número de cotización (Ej: COT-2024-001)
 * Útil para el campo 'numero' que es UNIQUE en tu SQL
 */
export async function generarNumeroCotizacion(supabase: SupabaseClient) {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('cotizaciones')
    .select('*', { count: 'exact', head: true });

  const correlativo = (count || 0) + 1;
  return `COT-${year}-${correlativo.toString().padStart(4, '0')}`;
}

/**
 * Serializador para objetos que vienen con BigInt de la DB
 * Evita el error "Do not know how to serialize a BigInt"
 */
export function serializarBigInt(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}