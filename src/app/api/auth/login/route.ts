import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;

  record.count++;
  return true;
}

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      `Variables de entorno faltantes: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL' : ''} ${!anonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''}`.trim()
    );
  }

  return { url, anonKey };
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await request.json();
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabaseEnv();

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { auth_id: authData.user.id },
      select: {
        id: true,
        rol: true,
        estado: true,
        clientes: { select: { id: true } },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no registrado en el sistema' },
        { status: 403 }
      );
    }

    if (usuario.estado?.toLowerCase() !== 'activo') {
      return NextResponse.json(
        { error: 'La cuenta no se encuentra activa' },
        { status: 403 }
      );
    }

    let cliente_id = null;
    if (usuario.rol === 'cliente') {
      if (!usuario.clientes) {
        return NextResponse.json(
          { error: 'Perfil de cliente no vinculado' },
          { status: 403 }
        );
      }
      cliente_id = usuario.clientes.id;
    }

    return NextResponse.json({
      success: true,
      role: usuario.rol ? String(usuario.rol).toLowerCase().trim() : '',
      user_id: usuario.id.toString(),
      cliente_id: cliente_id?.toString() ?? null,
    });

  } catch (error) {
    console.error('Error en POST /api/auth/login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}