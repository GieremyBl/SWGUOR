import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Obtener todos los productos con sus categorías
export async function GET() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear un nuevo producto
export async function POST(req: Request) {
  const supabase = await createClient();
  
  try {
    const body = await req.json();
    
    // Validación básica de campos obligatorios
    if (!body.nombre || !body.sku || !body.precio) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('productos')
      .insert([{
        nombre: body.nombre,
        sku: body.sku,
        descripcion: body.descripcion,
        precio: body.precio,
        stock: body.stock || 0,
        stock_minimo: body.stock_minimo || 5,
        categoria_id: body.categoria_id,
        imagen_url: body.imagen_url,
        activo: true
      }])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH/PUT: Para actualizaciones rápidas (como el stock)
export async function PATCH(req: Request) {
  const supabase = await createClient();
  
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const body = await req.json();

    if (!id) return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });

    const { data, error } = await supabase
      .from('productos')
      .update(body)
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar un producto por ID
export async function DELETE(req: Request) {
  const supabase = await createClient();
  
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Eliminado correctamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}