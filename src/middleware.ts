import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. FILTRO DE RUTAS PÚBLICAS (Early Exit)
  if (['/auth', '/admin/acceso-denegado'].some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // --- PASO 1: CREACIÓN DEL CLIENTE CON SINCRONIZACIÓN DE COOKIES ---
  // Inicializamos la respuesta base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Sincronizamos las cookies tanto en el Request como en el Response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          
          // Actualizamos la respuesta con las nuevas cookies para que el navegador las reciba
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 2. REFRESCAR Y OBTENER USUARIO (Atomic Auth)
  // IMPORTANTE: getUser() internamente llama a setAll si el token necesita refresco
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return response;
  }

  // 3. BÚSQUEDA DE PERFIL (Ahora con cookies sincronizadas)
  const { data: personal } = await supabase
    .from('personal')
    .select('rol, estado')
    .eq('auth_id', user.id)
    .maybeSingle();

  // Si no es personal, buscamos en clientes
  let profile = null;
  if (personal) {
    profile = { role: personal.rol, status: personal.estado };
  } else {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('activo')
      .eq('auth_id', user.id)
      .maybeSingle();
    
    if (cliente) {
      profile = { role: 'cliente', status: cliente.activo };
    }
  }

  // 4. DIAGNÓSTICO Y VALIDACIÓN
  if (!profile) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=USUARIO_NO_EN_TABLAS&buscando_id=${user.id}`, request.url)
    );
  }

  const finalStatus = String(profile.status).toLowerCase().trim();
  const finalRole = String(profile.role).toLowerCase().trim();

  if (finalStatus !== 'activo') {
    return NextResponse.redirect(
      new URL(`/auth/login?error=ESTADO_INVALIDO&estado_en_db=${finalStatus}`, request.url)
    );
  }

  // 5. PROTECCIÓN DE ÁREAS
  if (pathname.startsWith('/admin') && finalRole === 'cliente') {
    return NextResponse.redirect(new URL('/admin/acceso-denegado', request.url));
  }
  
  if (pathname.startsWith('/portal') && finalRole !== 'cliente') {
    return NextResponse.redirect(new URL('/admin/Panel-Administrativo/dashboard', request.url));
  }

  // Retornamos la respuesta final que ya tiene las cookies actualizadas
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
};