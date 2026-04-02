import { createClient } from '@/lib/supabase/server';
import { obtenerInsumos, crearInsumo, actualizarStockFisicoInsumo } from '@/lib/helpers/productos-helpers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    
    // Ahora pasamos supabase como primer argumento
    const data = await obtenerInsumos(supabase); 

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    if (!body.nombre || typeof body.stock_actual !== 'number') {
      return NextResponse.json({ error: 'Nombre y Stock Inicial son obligatorios' }, { status: 400 });
    }

    // Pasamos supabase y el objeto de datos
    const data = await crearInsumo(supabase, {
      nombre:          body.nombre,
      tipo:            body.tipo,
      unidad_medida:   body.unidad_medida,
      stock_actual:    body.stock_actual,
      stock_minimo:    body.stock_minimo ?? 0,
      precio_unitario: body.precio_unitario ?? null,
      proveedor:       body.proveedor ?? null,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    // Corregido: nombre de tabla 'insumos' y quitamos el 'as any' innecesario
    const { error } = await supabase
      .from('insumos')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    return NextResponse.json({ message: 'Item de inventario eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const body = await req.json();

    // Ahora pasamos supabase al helper
    const { success, error } = await actualizarStockFisicoInsumo(supabase, parseInt(id), body.stock_actual);

    if (error) throw new Error(error);
    if (!success) return NextResponse.json({ error: 'Error al actualizar stock' }, { status: 400 });

    // Consultamos el dato actualizado para devolverlo
    const { data: updatedData, error: fetchError } = await supabase
      .from('insumos')
      .select()
      .eq('id', parseInt(id))
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(updatedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}