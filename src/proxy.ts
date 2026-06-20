import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const routePermissions: Record<string, string[]> = {
  '/admin/Panel-Administrativo/dashboard': ['administrador', 'recepcionista', 'disenador', 'cortador', 'ayudante', 'representante_taller', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/usuarios': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/personal': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/clientes': ['administrador', 'recepcionista', 'gerente'],
  '/admin/Panel-Administrativo/pedidos': ['administrador', 'recepcionista', 'disenador', 'cortador', 'gerente', 'representante_taller', 'almacenero', 'ayudante'],
  '/admin/Panel-Administrativo/productos': ['administrador', 'disenador', 'gerente', 'recepcionista', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/fichas-tecnicas': ['administrador', 'gerente', 'disenador', 'cortador'],
  '/admin/Panel-Administrativo/inventario': ['administrador', 'disenador', 'gerente', 'cortador', 'ayudante', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/movimientos': ['administrador', 'gerente', 'disenador', 'cortador', 'ayudante', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/ordenes-produccion': ['administrador', 'gerente', 'disenador', 'cortador', 'representante_taller', 'ayudante'],
  '/admin/Panel-Administrativo/confecciones': ['administrador', 'representante_taller', 'gerente', 'almacenero', 'ayudante'],
  '/admin/Panel-Administrativo/cotizaciones': ['administrador', 'recepcionista', 'gerente'],
  '/admin/Panel-Administrativo/categorias': ['administrador', 'disenador', 'gerente'],
  '/admin/Panel-Administrativo/matriz-descuentos': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/talleres': ['administrador', 'gerente', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/pagos-taller': ['administrador', 'gerente', 'representante_taller'],
  '/admin/Panel-Administrativo/proveedores': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/insumos': ['administrador', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/materiales': ['administrador', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/cotizaciones-proveedor': ['administrador', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/despachos': ['administrador', 'recepcionista', 'gerente', 'ayudante', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/guias-remision': ['administrador', 'recepcionista', 'gerente', 'ayudante', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/asientos-contables': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/devoluciones-cliente': ['administrador', 'gerente', 'recepcionista'],
  '/admin/Panel-Administrativo/devoluciones-proveedor': ['administrador', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/pagos': ['administrador', 'gerente', 'recepcionista'],
  '/admin/Panel-Administrativo/costo-envio': ['administrador', 'gerente', 'recepcionista'],
  '/admin/Panel-Administrativo/feedback-cliente': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/notificaciones': ['administrador', 'recepcionista', 'disenador', 'cortador', 'ayudante', 'representante_taller', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/almacenes': ['administrador', 'gerente', 'almacenero'],
  '/admin/Panel-Administrativo/incidencias-taller': ['administrador', 'gerente', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/incidencias-cliente': ['administrador', 'gerente', 'recepcionista', 'representante_taller', 'almacenero'],
  '/admin/Panel-Administrativo/incidencias-clientes': ['administrador', 'gerente', 'representante_taller', 'almacenero'],
  '/portal/dashboard': ['cliente'],
  '/disenador/pedidos': ['disenador', 'administrador', 'gerente'],
  '/cortador/pedidos': ['cortador', 'administrador', 'gerente'],
  '/representante/ordenes': ['representante_taller', 'administrador', 'gerente'],
  '/ayudante/confecciones': ['ayudante', 'administrador', 'gerente'],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  // 1. RUTAS PÚBLICAS Y ENDPOINTS INTERNOS DE AUTH
  const publicPaths = ['/login-admin', '/login-cliente', '/auth/signup', '/admin/acceso-denegado', '/api/auth'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Saltamos RLS de forma segura en Servidor
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
    const loginUrl = new URL('/login-admin', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. OBTENER USUARIO USANDO MAYBE_SINGLE
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol, estado')
    .eq('auth_id', user.id)
    .maybeSingle();

  // Si la sesión existe en Supabase Auth pero la tabla intermedia está en proceso de lectura,
  // permitimos la resolución normal del cliente para evitar coli siones de estado asíncronas
  if (!usuario) {
    return response;
  }

  // 4. VALIDAR ESTADO (Case Insensitive)
  if (usuario.estado?.toLowerCase().trim() !== 'activo') {
    return NextResponse.redirect(new URL('/login-admin?error=cuenta_inactiva', request.url));
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
    const rolesPermitidosLower = rolesPermitidos.map(r => r.toLowerCase());

    if (!esSuperUsuario && !rolesPermitidosLower.includes(userRole)) {
      return NextResponse.redirect(new URL('/admin/acceso-denegado', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/portal/:path*',
    '/disenador/:path*',
    '/cortador/:path*',
    '/representante/:path*',
    '/ayudante/:path*',
  ],
};