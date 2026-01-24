import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Obtener inventario con nombres de categorías y productos vinculados
export async function GET() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('inventario')
      .select(`
        *,
        categorias (
          nombre
        ),
        productos (
          nombre
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Registrar un nuevo insumo o material
export async function POST(req: Request) {
  const supabase = await createClient();
  
  try {
    const body = await req.json();
    
    // Validaciones básicas
    if (!body.nombre || !body.stock_actual) {
      return NextResponse.json({ error: 'Nombre y Stock Inicial son obligatorios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('inventario')
      .insert([{
        nombre: body.nombre,
        tipo: body.tipo,
        unidad_medida: body.unidad_medida,
        stock_actual: body.stock_actual,
        stock_minimo: body.stock_minimo || 0,
        categoria_id: body.categoria_id,
        producto_id: body.producto_id, // Puede ser null
        cantidad_usada: body.cantidad_usada || 0,
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar un item del inventario
export async function DELETE(req: Request) {
  const supabase = await createClient();
  
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Item de inventario eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Editar un item del inventario
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const id = params.id;

  try {
    const body = await req.json();

    // Actualizamos solo los campos permitidos
    const { data, error } = await supabase
      .from('inventario')
      .update({
        nombre: body.nombre,
        tipo: body.tipo,
        unidad_medida: body.unidad_medida,
        stock_actual: body.stock_actual,
        stock_minimo: body.stock_minimo,
        categoria_id: body.categoria_id,
        producto_id: body.producto_id,
        cantidad_usada: body.cantidad_usada,
        updated_at: new Date().toISOString(), // Mantenemos el registro al día
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No se encontró el insumo' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}