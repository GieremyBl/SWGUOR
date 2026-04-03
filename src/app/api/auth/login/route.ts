import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => {
          const store = await cookieStore;
          return store.getAll();
        },
        setAll: async (cookiesToSet) => {
          const store = await cookieStore;
          cookiesToSet.forEach(({ name, value, options }) => 
            store.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Intentar iniciar sesión en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }

  // 2. Definir el tipo de perfil para TypeScript
  let perfil: { id: any; estado: string; rol: string } | null = null;

  // BUSQUEDA EN PERSONAL (Según tu SQL: id, rol, estado, auth_id)
  const { data: staff } = await supabase
    .from('personal')
    .select('id, rol, estado')
    .eq('auth_id', authData.user.id)
    .maybeSingle();

  if (staff) {
    perfil = {
      id: staff.id,
      rol: staff.rol,
      estado: String(staff.estado).toLowerCase().trim()
    };
  } else {
    // BUSQUEDA EN CLIENTES (Según tu SQL: id, activo, auth_id)
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, activo')
      .eq('auth_id', authData.user.id)
      .maybeSingle();
    
    if (cliente) {
      perfil = {
        id: cliente.id,
        rol: 'cliente',
        estado: String(cliente.activo).toLowerCase().trim() 
      };
    }
  }

  // --- AQUÍ ESTABA EL ERROR DE TYPESCRIPT ---
  // Validamos si perfil es null ANTES de usarlo
  if (!perfil) {
    return NextResponse.json({ 
      error: 'Usuario autenticado pero sin registro en el sistema.' 
    }, { status: 403 });
  }

  // Ahora TypeScript sabe que 'perfil' NO es null aquí abajo
  if (perfil.estado !== 'activo') {
    return NextResponse.json({ 
      error: `Tu cuenta no está activa (Estado: ${perfil.estado}).` 
    }, { status: 403 });
  }

  return NextResponse.json({ 
    success: true, 
    role: perfil.rol,
    user_id: perfil.id
  });
}