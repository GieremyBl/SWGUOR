import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const routePermissions: Record<string, string[]> = {
  '/admin/Panel-Administrativo/dashboard': ['administrador', 'recepcionista', 'diseñador', 'cortador', 'ayudante', 'representante_taller'],
  '/admin/Panel-Administrativo/usuarios': ['administrador'],
  '/admin/Panel-Administrativo/clientes': ['administrador', 'recepcionista'],
  '/admin/Panel-Administrativo/pedidos': ['administrador', 'recepcionista', 'diseñador', 'cortador'],
  '/admin/Panel-Administrativo/productos': ['administrador', 'diseñador'],
  '/admin/Panel-Administrativo/inventario': ['administrador', 'diseñador'],
  '/admin/Panel-Administrativo/confecciones': ['administrador', 'representante_taller'],
  '/admin/Panel-Administrativo/cotizaciones': ['administrador', 'recepcionista'],
  '/admin/Panel-Administrativo/categorias': ['administrador', 'diseñador'],
  '/admin/Panel-Administrativo/talleres': ['administrador'],
  '/admin/Panel-Administrativo/ventas': ['administrador', 'recepcionista'],
  '/admin/Panel-Administrativo/despachos': ['administrador', 'recepcionista'],
  '/admin/Panel-Administrativo/pagos': ['administrador'],
  '/admin/Panel-Administrativo/notificaciones': ['administrador', 'recepcionista'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[MIDDLEWARE] Processing:', pathname);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  console.log('[MIDDLEWARE] User:', user?.id || 'No user');

  // Rutas públicas
  const publicPaths = ['/admin/login', '/admin/acceso-denegado'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    console.log('[MIDDLEWARE] Public path');
    return response;
  }

  // Protección Panel Administrativo
  if (pathname.startsWith('/admin/Panel-Administrativo')) {
    if (!user) {
      console.log('[MIDDLEWARE] No user, redirecting to login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('auth_id', user.id)
      .maybeSingle();

    console.log('[MIDDLEWARE] Usuario:', { usuario, error });

    if (error || !usuario) {
      console.log('[MIDDLEWARE] User not found in DB');
      return NextResponse.redirect(new URL('/admin/login?error=usuario_no_encontrado', request.url));
    }

    const estadoLimpio = usuario.estado?.toString().toLowerCase().trim();

    if (estadoLimpio !== 'activo') {
      console.log('[MIDDLEWARE] User inactive');
      return NextResponse.redirect(new URL('/admin/login?error=usuario_inactivo', request.url));
    }

    const userRole = usuario.rol?.toLowerCase();
    
    const matchedRoute = Object.keys(routePermissions)
      .filter(route => pathname === route || pathname.startsWith(route + '/'))
      .sort((a, b) => b.length - a.length)[0];

    if (matchedRoute) {
      const allowedRoles = routePermissions[matchedRoute];
      if (userRole && !allowedRoles.includes(userRole)) {
        console.log('[MIDDLEWARE] Access denied');
        return NextResponse.redirect(new URL('/admin/acceso-denegado', request.url));
      }
    }

    response.headers.set('x-user-role', usuario.rol);
  }

  // Redirigir usuarios logueados del login al dashboard
  if (user && pathname === '/admin/login') {
    console.log('[MIDDLEWARE] Logged user on login, redirect to dashboard');
    return NextResponse.redirect(new URL('/admin/Panel-Administrativo/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};