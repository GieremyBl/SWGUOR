import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  let authUserId: string | null = null;
  let usuarioId: number | null = null;
  let clienteId: number | null = null;

  try {
    const {
      email,
      password,
      telefono,
      ruc,
      razon_social,
      nombre_comercial,
      direccion,
      tipo_cliente = 'corporativo',
    } = await request.json();

    if (!email || !password || !ruc || !razon_social) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: email, password, ruc, razon_social' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // PASO 1: Crear usuario en Supabase Auth
    // email_confirm: true → cuenta activa inmediatamente, sin verificación
    // -------------------------------------------------------
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ← Activo inmediatamente, sin correo de verificación
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
        rol: 'cliente', // ← valor correcto del enum, no el tipo
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
        nombre_comercial: nombre_comercial ?? null,
        email,
        telefono: telefono ?? null,
        direccion_fiscal: direccion ?? null,
        tipo_cliente: (tipo_cliente ?? 'corporativo') as any,
        activo: 'activo' as any,
      })
      .select('id')
      .single();

    if (clienteError || !nuevoCliente) {
      if (clienteError?.message.includes('clientes_ruc_key')) {
        throw new Error('El RUC ya está registrado en el sistema');
      }
      if (clienteError?.message.includes('clientes_usuario_id_key')) {
        throw new Error('Este usuario ya tiene un cliente asociado');
      }
      throw new Error(`Cliente insert error: ${clienteError?.message}`);
    }

    clienteId = nuevoCliente.id; // ← ahora sí se asigna correctamente para el rollback

    return NextResponse.json(
      {
        success: true,
        message: 'Cuenta creada exitosamente',
        user_id: usuarioId,
        cliente_id: clienteId,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error en registro:', error);

    // Rollback en orden inverso
    if (clienteId) {
      const { error: e } = await supabaseAdmin.from('clientes').delete().eq('id', clienteId);
      if (e) console.error('Rollback clientes falló:', e);
    }
    if (usuarioId) {
      const { error: e } = await supabaseAdmin.from('usuarios').delete().eq('id', usuarioId);
      if (e) console.error('Rollback usuarios falló:', e);
    }
    if (authUserId) {
      const { error: e } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (e) console.error('Rollback auth falló:', e);
    }

    const mensajeError = error?.message?.includes('RUC') || error?.message?.includes('usuario ya tiene')
      ? error.message
      : 'Error al crear la cuenta. Intente nuevamente.';

    return NextResponse.json({ error: mensajeError }, { status: 500 });
  }
}