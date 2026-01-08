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
  
  // Creamos la respuesta una sola vez
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

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

  // Una sola llamada para obtener el usuario
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Si está en login y ya tiene sesión -> al dashboard
  if (pathname === '/admin/login' && user) {
    return NextResponse.redirect(new URL('/admin/Panel-Administrativo/dashboard', request.url));
  }

  // 2. Si intenta entrar al panel y NO hay sesión -> al login
  if (pathname.startsWith('/admin/Panel-Administrativo') && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // 3. Verificación de Rol y Estado (Solo si está dentro del panel)
  if (pathname.startsWith('/admin/Panel-Administrativo') && user) {
    let usuario = userCache.get(user.id);

    if (!usuario) {
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('rol, estado')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!usuarioData || usuarioData.estado?.toLowerCase() !== 'activo') {
        return NextResponse.redirect(new URL('/admin/login?error=acceso_denegado', request.url));
      }
      usuario = usuarioData;
      userCache.set(user.id, usuario);
    }
    
    response.headers.set('x-user-role', usuario.rol);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};