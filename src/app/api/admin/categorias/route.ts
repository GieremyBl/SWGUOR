import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Obtener categorías activas para los selectores
export async function GET() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nombre, descripcion, activo')
      .eq('activo', true) // Solo traemos las que están listas para usar
      .order('nombre', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear una nueva categoría (por si quieres gestionarlas después)
export async function POST(req: Request) {
  const supabase = await createClient();
  
  try {
    const body = await req.json();
    
    if (!body.nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categorias')
      .insert([{
        nombre: body.nombre,
        descripcion: body.descripcion,
        activo: true
      }])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar una categoría por ID
export async function DELETE(req: Request) {
  const supabase = await createClient();
  
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Eliminado correctamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}