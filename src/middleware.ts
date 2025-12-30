import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { userCache } from '@/lib/cache';

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

  // Rutas públicas - no validar
  const publicPaths = ['/admin/login', '/admin/acceso-denegado', '/admin/auth/signout'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response;
  }

  // Protección Panel Administrativo
  if (pathname.startsWith('/admin/Panel-Administrativo')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    let usuario = userCache.get(user.id);

    if (!usuario) {
      // Si no está en caché, consultar BD
      const { data: usuarioData, error } = await supabase
        .from('usuarios')
        .select('rol, estado')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (error || !usuarioData) {
        return NextResponse.redirect(new URL('/admin/login?error=usuario_no_encontrado', request.url));
      }

      usuario = usuarioData;
      // Guardar en caché para próximas requests
      userCache.set(user.id, usuario);
    }

    const estadoLimpio = usuario.estado?.toString().toLowerCase().trim();

    if (estadoLimpio !== 'activo') {
      return NextResponse.redirect(new URL('/admin/login?error=usuario_inactivo', request.url));
    }

    const userRole = usuario.rol?.toLowerCase();

    const matchedRoute = Object.keys(routePermissions)
      .filter(route => pathname === route || pathname.startsWith(route + '/'))
      .sort((a, b) => b.length - a.length)[0];

    if (matchedRoute) {
      const allowedRoles = routePermissions[matchedRoute];
      if (userRole && !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/admin/acceso-denegado', request.url));
      }
    }

    response.headers.set('x-user-role', usuario.rol);
  }

  // Redirigir usuarios logueados del login al dashboard
  if (user && pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin/Panel-Administrativo/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};