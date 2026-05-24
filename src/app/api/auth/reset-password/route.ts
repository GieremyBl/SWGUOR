import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
    try {
        const { access_token, password } = await request.json();

        if (!access_token || !password) {
            return NextResponse.json(
                { error: 'Token de sesión y nueva contraseña son requeridos' },
                { status: 400 }
            );
        }

        // Validar fortaleza de contraseña (mismas reglas que el frontend)
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUpper || !hasLower || !hasNumber || !hasSpecial || password.length < 8) {
            return NextResponse.json(
                { error: 'La contraseña no cumple los requisitos de seguridad' },
                { status: 400 }
            );
        }

        // Obtener el usuario desde el access_token que generó verifyOtp
        const supabasePublic = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user }, error: userError } = await supabasePublic.auth.getUser(access_token);

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Sesión de recuperación inválida. Inicia el proceso nuevamente.' },
                { status: 401 }
            );
        }

        // Actualizar contraseña usando el service role (no requiere sesión activa)
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password }
        );

        if (updateError) {
            throw new Error(`Auth update error: ${updateError.message}`);
        }

        return NextResponse.json(
            { success: true, message: 'Contraseña actualizada correctamente' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error en reset-password:', error);
        return NextResponse.json(
            { error: 'Error al restablecer la contraseña. Intente nuevamente.' },
            { status: 500 }
        );
    }
}