// src/app/api/incidencias/route.ts// src/app/api/incidencias/route.ts
//
// Recibe la incidencia que el cliente envía desde el modal del portal,
// sube la foto (si la hay) a Supabase Storage y la guarda en la tabla
// incidencias_cliente.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  tipoIncidenciaSchema,
  severidadSchema,
} from '@/lib/schemas/incidencias-cliente';

export async function POST(req: NextRequest) {
  try {
    // ─── 1. Verificar sesión y resolver el cliente logueado ───────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { auth_id: user.id },
      select: { clientes: { select: { id: true } } },
    });

    const clienteId = usuario?.clientes?.id;
    if (!clienteId) {
      return NextResponse.json(
        { message: 'Cliente no encontrado' },
        { status: 404 },
      );
    }

    // ─── 2. Leer el FormData que envía el modal ───────────────────────────
    const form = await req.formData();
    const pedidoIdRaw = form.get('pedido_id');
    const tipoRaw = form.get('tipo');
    const severidadRaw = form.get('severidad');
    const descripcion = String(form.get('descripcion') ?? '').trim();
    const foto = form.get('foto');

    // ─── 3. Validar los datos ─────────────────────────────────────────────
    const tipo = tipoIncidenciaSchema.safeParse(tipoRaw);
    const severidad = severidadSchema.safeParse(severidadRaw);

    if (!pedidoIdRaw) {
      return NextResponse.json(
        { message: 'Falta el número de pedido.' },
        { status: 400 },
      );
    }
    if (!tipo.success) {
      return NextResponse.json(
        { message: 'Tipo de incidencia inválido.' },
        { status: 400 },
      );
    }
    if (!severidad.success) {
      return NextResponse.json(
        { message: 'Nivel de severidad inválido.' },
        { status: 400 },
      );
    }
    if (descripcion.length < 3) {
      return NextResponse.json(
        { message: 'La descripción es obligatoria.' },
        { status: 400 },
      );
    }

    // ─── 4. Subir la foto (si la hay) al bucket "evidencias" ──────────────
    const evidencia_url: string[] = [];

    if (foto instanceof File && foto.size > 0) {
      const ext = foto.name.split('.').pop() || 'jpg';
      const path = `incidencias/${clienteId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(path, foto, { contentType: foto.type, upsert: false });

      if (uploadError) {
        return NextResponse.json(
          { message: `No se pudo subir la foto: ${uploadError.message}` },
          { status: 500 },
        );
      }

      const { data: pub } = supabase.storage
        .from('evidencias')
        .getPublicUrl(path);
      evidencia_url.push(pub.publicUrl);
    }

    // ─── 5. Guardar la incidencia en la base de datos ─────────────────────
    await prisma.incidencias_cliente.create({
      data: {
        cliente_id: clienteId,
        pedido_id: BigInt(String(pedidoIdRaw)),
        tipo: tipo.data,
        severidad: severidad.data,
        descripcion,
        evidencia_url,
        estado: 'abierta',
      },
    });

    // ─── 6. Responder OK ──────────────────────────────────────────────────
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ message }, { status: 500 });
  }
}