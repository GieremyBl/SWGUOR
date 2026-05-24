// app/api/portal/notificaciones/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // ajusta al path de tu createClient server

// ── PATCH /api/portal/notificaciones/[id] ───────────────────────────────────
// Marca una notificación específica como leída
// Verifica que pertenezca al usuario autenticado antes de actualizar
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notifId = Number(id);

    if (isNaN(notifId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver usuario_id
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (usuarioError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Actualizar solo si la notificación pertenece al usuario (seguridad extra)
    const { data, error } = await supabase
      .from('notificaciones')
      .update({ leido: true, leido_at: new Date().toISOString() })
      .eq('id', notifId)
      .eq('usuario_id', usuario.id) // ← evita que un usuario marque notifs de otro
      .select()
      .maybeSingle();

    if (error) {
      console.error('[API notificaciones PATCH id]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[API notificaciones PATCH id] Unexpected:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}