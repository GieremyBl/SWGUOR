// app/api/portal/notificaciones/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // ajusta al path de tu createClient server

// ── GET /api/portal/notificaciones ──────────────────────────────────────────
// Devuelve las últimas 15 notificaciones del usuario autenticado
export async function GET() {
  try {
    const supabase = await createClient();

    // La sesión viene de las cookies — siempre disponible en el servidor
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver usuario_id desde auth_id
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (usuarioError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener notificaciones
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', usuario.id)
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) {
      console.error('[API notificaciones GET]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sinLeer = (data ?? []).filter(n => !n.leido).length;

    return NextResponse.json({
      data: data ?? [],
      kpis: { sinLeer, total: (data ?? []).length },
    });
  } catch (err) {
    console.error('[API notificaciones GET] Unexpected:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ── PATCH /api/portal/notificaciones ────────────────────────────────────────
// Marca TODAS las notificaciones del usuario como leídas
export async function PATCH() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (usuarioError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true, leido_at: new Date().toISOString() })
      .eq('usuario_id', usuario.id)
      .eq('leido', false);

    if (error) {
      console.error('[API notificaciones PATCH all]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API notificaciones PATCH] Unexpected:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}