// src/lib/with-audit.ts
import { createAuditHandler } from '@/lib/api-handler';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const withAudit = createAuditHandler(async () => {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
            },
        }
    );

    // 1. Verificar sesión activa
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // 2. Obtener el ID interno de la tabla `usuarios`
    const { data, error: dbError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (dbError || !data) return null;

    return BigInt(data.id);
});