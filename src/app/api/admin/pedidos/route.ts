import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST: Crear un nuevo pedido con detalles y actualizar stock
export async function POST(req: Request) {
  const supabase = await createClient();
  
  try {
    const body = await req.json();
    const { cliente_id, productos, metodo_pago, subtotal, impuesto, total } = body;

    // 1. Iniciar la inserción del pedido principal
    
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([{
        cliente_id,
        metodo_pago,
        subtotal,
        impuesto,
        total,
        estado: 'PENDIENTE',
        fecha_pedido: new Date().toISOString()
      }])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    // 2. Insertar detalles del pedido y actualizar stock
    for (const item of productos) {
      
      // A. Insertar en detalles_pedido
      const { error: detalleError } = await supabase
        .from('detalles_pedido')
        .insert([{
          pedido_id: pedido.id,
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          subtotal: item.precio * item.cantidad
        }]);

      if (detalleError) throw detalleError;

      // B. DESCUENTO DE STOCK (Lógica crucial)
      const { error: stockError } = await supabase.rpc('restar_stock', {
        producto_id_param: item.id,
        cantidad_param: item.cantidad
      });

      if (stockError) throw stockError;
    }

    return NextResponse.json(pedido, { status: 201 });

  } catch (error: any) {
    console.error('Error en Pedidos:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATH: Cancelar un pedido (marcar como 'cancelado')
export async function PATCH(req: Request) {
  const supabase = await createClient();
  
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    // 1. Obtener los detalles del pedido ANTES de cancelar para saber qué devolver al stock
    const { data: detalles, error: errorDetalles } = await supabase
      .from('detalles_pedido')
      .select('producto_id, cantidad')
      .eq('pedido_id', id);

    if (errorDetalles) throw errorDetalles;

    // 2. Cambiar el estado del pedido a CANCELADO
    const { error: errorPedido } = await supabase
      .from('pedidos')
      .update({ estado: 'CANCELADO' })
      .eq('id', id);

    if (errorPedido) throw errorPedido;

    // 3. Devolver el stock de cada producto
    if (detalles) {
      for (const item of detalles) {
        await supabase.rpc('sumar_stock', {
          producto_id_param: item.producto_id,
          cantidad_param: item.cantidad
        });
      }
    }

    return NextResponse.json({ message: 'Pedido cancelado y stock restaurado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}