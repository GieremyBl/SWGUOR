// src/app/api/auth/login/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Rate limiting simple en memoria (para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // intentos por IP
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: Request) {
  // Obtener IP del cliente
  const ip = request.headers.get('x-forwarded-for') ||
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

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // 2. Consulta unificada usando Prisma para máxima velocidad
    const usuario = await prisma.usuarios.findUnique({
      where: { auth_id: authData.user.id },
      select: {
        id: true,
        rol: true,
        estado: true,
        clientes: { select: { id: true } }
      }
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no registrado en el sistema' }, { status: 403 });
    }

    // 3. Validación de estado (ignora mayúsculas)
    if (usuario.estado?.toLowerCase() !== 'activo') {
      return NextResponse.json({ error: 'La cuenta no se encuentra activa' }, { status: 403 });
    }

    // 4. Extraer cliente_id de la relación directa si es cliente
    let cliente_id = null;
    if (usuario.rol === 'cliente') {
      if (!usuario.clientes) {
        return NextResponse.json({ error: 'Perfil de cliente no vinculado' }, { status: 403 });
      }
      cliente_id = usuario.clientes.id;
    }

    return NextResponse.json({
      success: true,
      role: usuario.rol ? String(usuario.rol).toLowerCase().trim() : '',
      user_id: usuario.id.toString(),
      cliente_id: cliente_id?.toString() || null
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}