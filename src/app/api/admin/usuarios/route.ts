import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Obtener todos los usuarios (Se mantiene igual)
export async function GET() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear nuevo personal en AUTH y en la TABLA
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, nombre_completo, telefono, rol, estado } = body;

    // 1. Validaciones básicas
    if (!nombre_completo || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 });
    }

    // 2. Crear Cliente de Administración (Service Role)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 3. Crear el personal en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true, // Para que el personal no tenga que verificar su correo y pueda entrar ya
      user_metadata: { nombre_completo } // Opcional: guardar nombre en metadata de auth
    });

    if (authError) {
      console.error('Error en Auth:', authError.message);
      return NextResponse.json({ error: `Error en Autenticación: ${authError.message}` }, { status: 400 });
    }

    // 4. Insertar en tu tabla pública 'usuarios' usando el ID generado
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert([{
        auth_id: authData.user.id, // VÍNCULO CRUCIAL
        nombre_completo: nombre_completo.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono?.trim() || null,
        rol: rol?.toLowerCase() || 'ayudante',
        estado: estado?.toLowerCase() || 'activo',
      }])
      .select()
      .single();

    if (dbError) {
      // Limpieza: si falla la tabla, borramos el personal de Auth para no dejar basura
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('Error en DB:', dbError.message);
      return NextResponse.json({ error: `Error en Tabla Usuarios: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json(userData, { status: 201 });

  } catch (error: any) {
    console.error('Error fatal:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PATCH: Editar información del personal
export async function PATCH(req: Request) {
  const supabase = await createClient();
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    // Validación de ID
    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' }, 
        { status: 400 }
      );
    }

    // Normalizar estado si está presente
    if (updates.estado) {
      const estadoNormalizado = updates.estado.toLowerCase().trim();
      const estadosValidos = ['activo', 'inactivo', 'suspendido'];
      
      if (!estadosValidos.includes(estadoNormalizado)) {
        return NextResponse.json(
          { error: `Estado debe ser uno de: ${estadosValidos.join(', ')}` }, 
          { status: 400 }
        );
      }
      
      updates.estado = estadoNormalizado;
    }

    // Normalizar rol si está presente
    if (updates.rol) {
      const rolNormalizado = updates.rol.toLowerCase().trim();
      const rolesValidos = [
        'administrador', 
        'cortador', 
        'diseñador', 
        'recepcionista', 
        'ayudante', 
        'representante_taller'
      ];
      
      if (!rolesValidos.includes(rolNormalizado)) {
        return NextResponse.json(
          { error: `Rol debe ser uno de: ${rolesValidos.join(', ')}` }, 
          { status: 400 }
        );
      }
      
      updates.rol = rolNormalizado;
    }

    // Normalizar email si está presente
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return NextResponse.json(
          { error: 'Formato de email inválido' }, 
          { status: 400 }
        );
      }
      updates.email = updates.email.trim().toLowerCase();
    }

    // Normalizar nombre si está presente
    if (updates.nombre_completo) {
      updates.nombre_completo = updates.nombre_completo.trim();
    }

    // Actualizar updated_at
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando personal:', error);
      
      // Manejar error de personal no encontrado
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'personal no encontrado' }, 
          { status: 404 }
        );
      }
      
      // Manejar error de email duplicado
      if (error.code === '23505' && error.message.includes('email')) {
        return NextResponse.json(
          { error: 'Este email ya está registrado' }, 
          { status: 409 }
        );
      }
      
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error en PATCH /api/usuarios:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar personal' }, 
      { status: 500 }
    );
  }
}

// DELETE: Eliminar personal
export async function DELETE(req: Request) {
  const supabase = await createClient();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' }, 
        { status: 400 }
      );
    }

    // Verificar que el personal existe antes de eliminar
    const { data: existingUser, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, nombre_completo')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'personal no encontrado' }, 
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando personal:', error);
      throw error;
    }

    return NextResponse.json({ 
      message: 'personal eliminado correctamente',
      deletedUser: existingUser 
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/usuarios:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar personal' }, 
      { status: 500 }
    );
  }
}