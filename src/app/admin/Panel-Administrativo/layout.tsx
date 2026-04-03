import type { Metadata } from "next";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RealtimeLayoutWrapper from '@/components/admin/layout/RealtimeLayoutWrapper';
import ReactQueryProvider from '@/components/admin/provider/ReactQueryProvider';

export const metadata: Metadata = {
  title: "Sistema GUOR - Gestión de Modas",
  description: "Panel administrativo y control de inventarios",
  robots: { index: false, follow: false },
};

async function getValidatedUser(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) return { error: 'no_auth' };

  // Bajo la OPCIÓN A, consultamos la tabla usuarios
  const { data: personal, error: usuarioError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (usuarioError || !personal) return { error: 'no_profile' };
  
  // VALIDACIÓN DE SEGURIDAD EXTRA: 
  // Si el personal es un 'cliente', no tiene nada que hacer en el Panel Administrativo
  if (personal.rol?.toLowerCase() === 'cliente') return { error: 'is_client' };

  if (personal.estado?.toUpperCase() !== 'ACTIVO') return { error: 'inactive' };

  return { personal };
}

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
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* SSR Safe */ }
        },
      },
    }
  );

  const { personal, error } = await getValidatedUser(supabase);

  // --- MANEJO DE REDIRECCIONES ACTUALIZADO ---
  
  // 1. Si no hay sesión o perfil, al login unificado
  if (error === 'no_auth' || error === 'no_profile') {
    redirect('/auth/login'); 
  }

  // 2. Si es un cliente intentando entrar a zona admin, al acceso denegado
  if (error === 'is_client') {
    redirect('/admin/acceso-denegado');
  }

  // 3. Si la cuenta está inactiva
  if (error === 'inactive') {
    redirect('/auth/login?error=cuenta_inactiva');
  }

  return (
    <ReactQueryProvider>
      <RealtimeLayoutWrapper initialUsuario={personal}>
        <div className="min-h-screen bg-slate-50/50">
          {children}
        </div>
      </RealtimeLayoutWrapper>
    </ReactQueryProvider>
  );
}