import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Manejo silencioso para Server Components
            }
          },
        },
      }
    );

    // 1. Autenticación en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // 2. Consulta de perfil con la relación corregida (usuarios -> clientes)
    // Usamos el nombre de la FK específica para evitar ambigüedad PGRST201
    const { data: usuario, error: dbError } = await supabase
      .from('usuarios')
      .select(`
        id,
        rol,
        estado,
        clientes!usuario_id (
          id,
          razon_social,
          ruc
        )
      `)
      .eq('auth_id', authData.user.id)
      .single();

    if (dbError || !usuario) {
      console.error('Error DB:', dbError);
      return NextResponse.json(
        { error: 'Usuario no encontrado en la base de datos' }, 
        { status: 403 }
      );
    }

    // 3. Validación de estado de cuenta
    if (usuario.estado !== 'activo') {
      return NextResponse.json({ error: 'Cuenta inactiva' }, { status: 403 });
    }

    // 4. Extraer el perfil del cliente
    // Como la relación es 1:1 o 1:N, extraemos el primer elemento si es array
    const clientePerfil = Array.isArray(usuario.clientes) 
      ? usuario.clientes[0] 
      : usuario.clientes;

    // 5. Si el rol es cliente, validar que tenga perfil vinculado
    if (usuario.rol === 'cliente' && !clientePerfil) {
      return NextResponse.json(
        { error: 'Perfil de cliente no vinculado a este usuario' }, 
        { status: 403 }
      );
    }

    // Respuesta de éxito
    return NextResponse.json({
      success: true,
      role: usuario.rol,
      user_id: usuario.id,
      cliente_id: clientePerfil?.id || null
    });

  } catch (error) {
    console.error("Internal Error:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}