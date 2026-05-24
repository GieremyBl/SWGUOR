import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email y código son requeridos' },
                { status: 400 }
            );
        }

        // Cliente público para verificar el OTP
        const supabasePublic = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Supabase verifica el código internamente
        // type: 'email' corresponde al OTP enviado por signInWithOtp
        const { data, error } = await supabasePublic.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
        });

        if (error || !data.session) {
            return NextResponse.json(
                { error: 'Código incorrecto o expirado' },
                { status: 400 }
            );
        }

        // Guardamos el access_token de la sesión temporal para usarlo
        // en reset-password sin pedirle el OTP de nuevo al usuario
        return NextResponse.json(
            {
                success: true,
                message: 'Código verificado correctamente',
                access_token: data.session.access_token,
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error en verify-otp:', error);
        return NextResponse.json(
            { error: 'Error al verificar el código. Intente nuevamente.' },
            { status: 500 }
        );
    }
}