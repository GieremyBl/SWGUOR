import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
        }

        // Verificar que el email exista en clientes
        // Respuesta genérica para no revelar si el email existe o no
        const { data: cliente } = await supabaseAdmin
            .from('clientes')
            .select('id')
            .eq('email', email)
            .single();

        if (!cliente) {
            return NextResponse.json(
                { success: true, message: 'Si el correo existe, recibirás el código en breve' },
                { status: 200 }
            );
        }

        // Cliente público para signInWithOtp (no usar service role aquí)
        const supabasePublic = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Supabase genera el código de 6 dígitos y lo envía automáticamente
        // El correo sale desde: noreply@mail.app.supabase.io
        const { error } = await supabasePublic.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false, // No crear usuario si no existe en Supabase Auth
            },
        });

        if (error) {
            throw new Error(`OTP error: ${error.message}`);
        }

        return NextResponse.json(
            { success: true, message: 'Si el correo existe, recibirás el código en breve' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error en send-otp:', error);
        return NextResponse.json(
            { error: 'No se pudo enviar el código. Intente nuevamente.' },
            { status: 500 }
        );
    }
}