
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';

export default async function PanelAdministrativoLayout({
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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component
          }
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/admin/login');
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (!usuario || usuarioError) {
    console.error('[LAYOUT] Error obteniendo usuario:', usuarioError);
    redirect('/admin/login');
  }

  if (usuario.estado?.toLowerCase() !== 'activo') {
    console.error('[LAYOUT] Usuario inactivo:', usuario.estado);
    redirect('/admin/login?error=cuenta_inactiva');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar usuario={usuario} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader usuario={usuario} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}