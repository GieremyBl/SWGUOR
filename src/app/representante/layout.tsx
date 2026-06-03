import type { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import RealtimeLayoutWrapper, {
  type UsuarioConPersonal,
} from '@/components/admin/layout/RealtimeLayoutWrapper';
import ReactQueryProvider from '@/components/admin/provider/ReactQueryProvider';
import { PermissionsProvider } from '@/components/providers/PermissionsProvider';

export const metadata: Metadata = {
  title: 'Taller — Sistema GUOR',
  description: 'Módulo representante de taller',
  robots: { index: false, follow: false },
};

const ROLES_PERMITIDOS = ['representante_taller', 'administrador', 'gerente'];

async function getValidatedUser(supabase: ReturnType<typeof createServerClient>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user || authError) return { error: 'no_auth' as const };

  const usuario = await prisma.usuarios.findUnique({
    where: { auth_id: user.id },
    include: {
      personal_interno: { select: { nombre_completo: true } },
    },
  });

  if (!usuario) return { error: 'no_profile' as const };
  if (usuario.rol?.toLowerCase() === 'cliente') return { error: 'is_client' as const };
  if (usuario.estado?.toUpperCase() !== 'ACTIVO') return { error: 'inactive' as const };

  const rol = usuario.rol?.toLowerCase().trim();
  if (!rol || !ROLES_PERMITIDOS.includes(rol)) {
    return { error: 'sin_permiso' as const };
  }

  return { usuario: usuario as UsuarioConPersonal, error: null };
}

export default async function RepresentanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              cookieStore.set(name, value, options),
            );
          } catch {
            /* SSR */
          }
        },
      },
    },
  );

  const { usuario, error } = await getValidatedUser(supabase);

  if (error === 'no_auth' || error === 'no_profile') {
    redirect('/auth/login');
  }
  if (error === 'is_client' || error === 'sin_permiso') {
    redirect('/admin/acceso-denegado');
  }
  if (error === 'inactive') {
    redirect('/auth/login?error=cuenta_inactiva');
  }

  if (!usuario) return null;

  return (
    <ReactQueryProvider>
      <PermissionsProvider usuario={usuario}>
        <RealtimeLayoutWrapper initialUsuario={usuario}>
          <div className="admin-card min-h-screen bg-slate-50/50">{children}</div>
        </RealtimeLayoutWrapper>
      </PermissionsProvider>
    </ReactQueryProvider>
  );
}
