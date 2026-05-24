import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const routePermissions: Record<string, string[]> = {
  '/admin/Panel-Administrativo/dashboard': ['administrador', 'recepcionista', 'disenador', 'cortador', 'ayudante', 'representante_taller', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/usuarios': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/personal': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/clientes': ['administrador', 'recepcionista', 'gerente'],
  '/admin/Panel-Administrativo/pedidos': ['administrador', 'recepcionista', 'disenador', 'cortador', 'gerente', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/productos': ['administrador', 'disenador', 'gerente', 'recepcionista', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/fichas-tecnicas': ['administrador', 'gerente', 'disenador', 'cortador'],
  '/admin/Panel-Administrativo/inventario': ['administrador', 'disenador', 'gerente', 'cortador', 'ayudante', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/movimientos': ['administrador', 'gerente', 'disenador', 'cortador', 'ayudante', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/ordenes-produccion': ['administrador', 'gerente', 'disenador', 'cortador', 'representante_taller', 'ayudante'],
  '/admin/Panel-Administrativo/confecciones': ['administrador', 'representante_taller', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/cotizaciones': ['administrador', 'recepcionista', 'gerente'],
  '/admin/Panel-Administrativo/categorias': ['administrador', 'disenador', 'gerente'],
  '/admin/Panel-Administrativo/talleres': ['administrador', 'gerente', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/proveedores': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/despachos': ['administrador', 'recepcionista', 'gerente', 'ayudante', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/pagos': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/feedback-cliente': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/notificaciones': ['administrador', 'recepcionista', 'disenador', 'cortador', 'ayudante', 'representante_taller', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/almacenes': ['administrador', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/incidencias-taller': ['administrador', 'gerente', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/incidencias-clientes': ['administrador', 'gerente', 'representante_taller', 'almacenero'],
  '/portal/dashboard': ['cliente'],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  // 1. RUTAS PÚBLICAS
  const publicPaths = ['/auth/login', '/auth/signup', '/admin/acceso-denegado'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 2. PROTECCIÓN DE SESIÓN
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. OBTENER USUARIO DE LA TABLA 'usuarios'
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, estado')
    .eq('auth_id', user.id)
    .single();

  // 4. VALIDAR ESTADO (Case Insensitive)
  if (!usuario || usuario.estado?.toUpperCase() !== 'ACTIVO') {
    return NextResponse.redirect(new URL('/auth/login?error=cuenta_inactiva', request.url));
  }

  const userRole = usuario.rol?.toLowerCase().trim();

  // 5. VALIDACIÓN CRUZADA ADMIN vs PORTAL
  if (pathname.startsWith('/admin') && userRole === 'cliente') {
    return NextResponse.redirect(new URL('/admin/acceso-denegado', request.url));
  }

  if (pathname.startsWith('/portal') && userRole !== 'cliente') {
    return NextResponse.redirect(new URL('/admin/Panel-Administrativo/dashboard', request.url));
  }

  // 6. RBAC - PERMISOS POR RUTA 
  const matchedRoute = Object.keys(routePermissions)
    .find(route => pathname === route || pathname.startsWith(route + '/'));

  if (matchedRoute) {
    const rolesPermitidos = routePermissions[matchedRoute];
    const esSuperUsuario = userRole === 'gerente' || userRole === 'administrador';

    // Normalizamos roles permitidos a minúsculas por seguridad
    const rolesPermitidosLower = rolesPermitidos.map(r => r.toLowerCase());

    if (!esSuperUsuario && !rolesPermitidosLower.includes(userRole)) {
      console.log(`Acceso denegado para: ${userRole} en ruta: ${pathname}`);
      return NextResponse.redirect(new URL('/admin/acceso-denegado', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/portal/:path*',
  ],
};