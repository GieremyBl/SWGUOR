import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { userCache } from '@/lib/cache';

// CONFIGURACIÓN DE PERMISOS POR ROL

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

const ESTADO_ACTIVO = 'ACTIVO'; // Cambiado a mayúsculas
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// FUNCIONES AUXILIARES

/**
 * Obtiene el usuario desde caché o BD con manejo de TTL
 */
async function getUserData(userId: string, supabase: any) {
  const cached = userCache.get(userId);
  
  // Validar caché con TTL
  if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Consultar BD si no hay caché válido
  try {
    const { data: usuarioData, error } = await supabase
      .from('usuarios')
      .select('id, rol, estado, auth_id')
      .eq('auth_id', userId)
      .maybeSingle();

    if (error || !usuarioData) {
      return null;
    }

    // Actualizar caché (timestamp se genera automáticamente)
    userCache.set(userId, usuarioData);

    return usuarioData;
  } catch (err) {
    console.error('Error fetching user data:', err);
    return null;
  }
}

/**
 * Encuentra la ruta coincidente más específica
 */
function findMatchingRoute(pathname: string): string | null {
  return Object.keys(routePermissions)
    .filter(route => pathname === route || pathname.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length)[0] || null;
}

/**
 * Verifica si el usuario tiene permisos para la ruta
 */
function hasPermission(userRole: string | undefined, route: string | null): boolean {
  if (!route || !userRole) return true; // Si no hay ruta específica, permitir
  
  const allowedRoles = routePermissions[route];
  return allowedRoles?.includes(userRole.toLowerCase()) ?? true;
}

// ============================================
// MIDDLEWARE PRINCIPAL
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  // Rutas públicas - permitir sin validación
  const publicPaths = ['/admin/login', '/admin/acceso-denegado', '/admin/auth/signout'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response;
  }

  // Crear cliente Supabase con manejo de cookies
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

  // Validar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Auth error in middleware:', authError.message);
  }

  // Protección de rutas administrativas
  if (pathname.startsWith('/admin/Panel-Administrativo')) {
    // Sin usuario autenticado -> redirigir a login
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Obtener datos del usuario con caché inteligente
    const usuario = await getUserData(user.id, supabase);

    if (!usuario) {
      // Usuario no encontrado en BD -> limpiar sesión
      userCache.delete(user.id);
      return NextResponse.redirect(
        new URL('/admin/login?error=usuario_no_encontrado', request.url)
      );
    }

    // Validar estado activo
    const estadoNormalizado = usuario.estado?.toString().toUpperCase().trim();
    if (estadoNormalizado !== ESTADO_ACTIVO) {
      userCache.delete(user.id);
      return NextResponse.redirect(
        new URL('/admin/login?error=usuario_inactivo', request.url)
      );
    }

    // Validar permisos por rol
    const userRole = usuario.rol?.toLowerCase();
    const matchedRoute = findMatchingRoute(pathname);

    if (!hasPermission(userRole, matchedRoute)) {
      return NextResponse.redirect(
        new URL('/admin/acceso-denegado', request.url)
      );
    }

    // Agregar header con rol del usuario (útil para layouts)
    response.headers.set('x-user-role', usuario.rol);
    response.headers.set('x-user-id', usuario.id.toString());
  }

  // Redirigir usuarios logueados desde login al dashboard
  if (user && pathname === '/admin/login') {
    return NextResponse.redirect(
      new URL('/admin/Panel-Administrativo/dashboard', request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};