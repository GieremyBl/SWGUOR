import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export default async function Home() {
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
            // Manejo silencioso en Server Components
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Si el personal ya está autenticado (es un cliente logueado)
  if (user) {
    // Redirigimos a la ruta del portal de clientes que estamos trabajando
    redirect('/portal/dashboard');
  }

  // 2. Si no hay sesión, mostramos la landing corporativa (o redirigimos al login)
  // Nota: Si prefieres que la landing sea visible para todos, no hagas redirect aquí 
  // y mueve el diseño de la landing directamente a este archivo. 
  // Por ahora, lo mandaremos al portal para que inicie sesión.
  redirect('/portal/dashboard'); 
}