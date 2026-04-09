import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Cliente admin con service role — solo para operaciones server-side críticas
// NUNCA exponer SUPABASE_SERVICE_ROLE_KEY al cliente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  // IDs para rollback en caso de fallo parcial
  let authUserId: string | null = null;
  let usuarioId: number | null = null;
  let clienteId: number | null = null;

  try {
    const {
      // Credenciales
      email,
      password,
      // Datos de usuarios
      nombre_completo,
      telefono,
      // Datos de clientes
      ruc,
      razon_social,
      direccion,
      tipo = 'corporativo',
    } = await request.json();

    // --- Validaciones básicas ---
    if (!email || !password || !nombre_completo || !ruc || !razon_social) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: email, password, nombre_completo, ruc, razon_social' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // PASO 1: Crear usuario en Supabase Auth
    //
    // email_confirm: false → Supabase envía el correo de confirmación
    // automáticamente a través del SMTP de Resend que configuraste.
    // El usuario queda en estado "pendiente" hasta que confirme.
    // -------------------------------------------------------
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // ← Resend enviará el email de confirmación
    });

    if (authError || !authData.user) {
      if (authError?.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 409 }
        );
      }
      throw new Error(`Auth error: ${authError?.message}`);
    }

    authUserId = authData.user.id;

    // -------------------------------------------------------
    // PASO 2: Crear registro en tabla usuarios
    // -------------------------------------------------------
    const { data: nuevoUsuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        auth_id: authUserId,
        email,
        nombre_completo,
        telefono: telefono ?? null,
        rol: 'cliente',
        estado: 'activo',
      })
      .select('id')
      .single();

    if (usuarioError || !nuevoUsuario) {
      throw new Error(`Usuario insert error: ${usuarioError?.message}`);
    }

    usuarioId = nuevoUsuario.id;

    // -------------------------------------------------------
    // PASO 3: Crear registro en tabla clientes
    // -------------------------------------------------------
    const { data: nuevoCliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .insert({
        usuario_id: usuarioId,
        ruc,
        razon_social,
        email,
        telefono: telefono ?? null,
        direccion: direccion ?? null,
        tipo,
        activo: 'activo',
      })
      .select('id')
      .single();

    if (clienteError || !nuevoCliente) {
      throw new Error(`Cliente insert error: ${clienteError?.message}`);
    }

    clienteId = nuevoCliente.id;

    // -------------------------------------------------------
    // Todo OK — NO hacemos signInWithPassword aquí.
    // El usuario debe confirmar su email primero (via Resend).
    // Supabase redirigirá al usuario a tu /auth/callback
    // una vez que haga clic en el enlace del correo.
    // -------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: 'Revisa tu email para confirmar tu cuenta',
        user_id: usuarioId,
        cliente_id: clienteId,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en registro:', error);

    // -------------------------------------------------------
    // ROLLBACK MANUAL en orden inverso
    // -------------------------------------------------------

    // 1. Eliminar cliente si se creó
    if (clienteId) {
      const { error: rollbackCliente } = await supabaseAdmin
        .from('clientes')
        .delete()
        .eq('id', clienteId);
      if (rollbackCliente) console.error('Rollback clientes falló:', rollbackCliente);
    }

    // 2. Eliminar usuario de la tabla usuarios
    if (usuarioId) {
      const { error: rollbackUsuario } = await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('id', usuarioId);
      if (rollbackUsuario) console.error('Rollback usuarios falló:', rollbackUsuario);
    }

    // 3. Eliminar usuario de Supabase Auth
    if (authUserId) {
      const { error: rollbackAuth } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (rollbackAuth) console.error('Rollback auth falló:', rollbackAuth);
    }

    return NextResponse.json(
      { error: 'Error al crear la cuenta. Intente nuevamente.' },
      { status: 500 }
    );
  }
}