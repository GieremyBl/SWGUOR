// src/lib/services/inventario.ts (o la ruta donde lo tengas)
import { supabase } from "@/lib/supabase/client/client"; // IMPORTANTE: Que apunte al client.ts tipado

export async function registrarFabricacion(
  productoId: number, 
  cantidad: number, 
  usuarioId: number, 
  motivo: string = "Ingreso por fabricación"
) {
  // Al usar este 'supabase', TS leerá automáticamente la interfaz Database
  const { data: producto, error: errorFetch } = await supabase
    .from('productos')
    .select('stock')
    .eq('id', productoId)
    .single();

  if (errorFetch || !producto) throw new Error("Producto no encontrado");

  // El error de 'stock' debería desaparecer aquí
  const nuevoTotal = (producto.stock ?? 0) + cantidad;

  // Actualización de producto
  const { error: errorUpdate } = await supabase
    .from('productos')
    .update({ 
      stock: nuevoTotal,
      estado: 'activo' 
    })
    .eq('id', productoId);

  if (errorUpdate) throw errorUpdate;

  // Inserción en movimientos
  const { error: errorMov } = await supabase
    .from('movimientos_inventario')
    .insert({
      producto_id: productoId,
      cantidad: cantidad,
      tipo_movimiento: 'entrada', 
      motivo: motivo,
      usuario_id: usuarioId,
    });

  if (errorMov) throw errorMov;

  return { success: true };
}