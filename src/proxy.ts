import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 1. CONFIGURACIÓN DE PERMISOS EXTENDIDA (Corregida con "ñ" y gerente)
const routePermissions: Record<string, string[]> = {
  '/admin/Panel-Administrativo/dashboard': ['administrador', 'gerente', 'recepcionista', 'diseñador', 'cortador', 'ayudante', 'representante_taller'],
  '/admin/Panel-Administrativo/usuarios': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/clientes': ['administrador', 'gerente', 'recepcionista'],
  '/admin/Panel-Administrativo/pedidos': ['administrador', 'gerente', 'recepcionista', 'diseñador', 'cortador'],
  '/admin/Panel-Administrativo/productos': ['administrador', 'gerente', 'diseñador'],
  '/admin/Panel-Administrativo/inventario': ['administrador', 'gerente', 'diseñador'],
  '/admin/Panel-Administrativo/confecciones': ['administrador', 'gerente', 'representante_taller'],
  '/admin/Panel-Administrativo/cotizaciones': ['administrador', 'gerente', 'recepcionista'],
  '/admin/Panel-Administrativo/categorias': ['administrador', 'gerente', 'diseñador'],
  '/admin/Panel-Administrativo/talleres': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/ventas': ['administrador', 'gerente', 'recepcionista'],
  '/admin/Panel-Administrativo/despachos': ['administrador', 'gerente', 'recepcionista'],
  '/admin/Panel-Administrativo/pagos': ['administrador', 'gerente'],
  '/admin/Panel-Administrativo/notificaciones': ['administrador', 'gerente', 'recepcionista', 'diseñador', 'cortador', 'ayudante', 'representante_taller'],

  '/portal/dashboard': ['cliente'],
  '/portal/productos': ['cliente'],
  '/portal/cotizaciones': ['cliente'],
  '/portal/ordenes': ['cliente'],
  '/portal/perfil': ['cliente'],
};

const ESTADO_ACTIVO = 'ACTIVO';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  // 2. RUTAS PÚBLICAS ÚNICAS
  const publicPaths = ['/auth/login', '/auth/register', '/admin/acceso-denegado'];
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

  // 3. PROTECCIÓN DE RUTAS PRIVADAS
  if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
    
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('auth_id', user.id)
      .single();

    if (!usuario || usuario.estado?.toUpperCase() !== ESTADO_ACTIVO) {
      return NextResponse.redirect(new URL('/auth/login?error=cuenta_inactiva', request.url));
    }

    // AÑADIDO: .trim() limpia cualquier espacio invisible accidental en la BD
    const userRole = usuario.rol?.toLowerCase().trim(); 

    // MENSAJES DE RASTREO: Esto imprimirá en tu consola de VSCode lo que está pasando
    console.log("-----------------------------------------");
    console.log(`Intentando acceder a: ${pathname}`);
    console.log(`Rol extraído de la BD: "${userRole}"`);

    // 4. VALIDACIÓN CRUZADA
    if (pathname.startsWith('/admin') && userRole === 'cliente') {
      console.log("Bloqueo: Un cliente intentó entrar a /admin");
      return NextResponse.redirect(new URL('/admin/acceso-denegado', request.url));
    }
    
    if (pathname.startsWith('/portal') && userRole !== 'cliente') {
      return NextResponse.redirect(new URL('/admin/Panel-Administrativo/dashboard', request.url));
    }

    // 5. VALIDACIÓN DE PERMISOS ESPECÍFICOS (RBAC)
    const matchedRoute = Object.keys(routePermissions)
      .find(route => pathname.startsWith(route));

    if (matchedRoute) {
      const rolesPermitidos = routePermissions[matchedRoute];
      if (!rolesPermitidos.includes(userRole)) {
        console.log(`Bloqueo RBAC: El rol "${userRole}" no está en la lista permitida para ${matchedRoute}`);
        console.log(`Lista permitida: ${rolesPermitidos.join(', ')}`);
        return NextResponse.redirect(new URL('/admin/acceso-denegado', request.url));
      } else {
        console.log("Acceso CONCEDIDO por el Middleware.");
      }
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