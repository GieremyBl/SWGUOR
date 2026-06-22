export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import {
  activarConversacionGuorino,
  archivarConversacionActivaGuorino,
  guardarMensajesConversacionGuorino,
  iniciarConversacionGuorino,
  listarConversacionesGuorino,
  obtenerConversacionActivaGuorino,
} from '@/lib/services/guorino-conversaciones.service';
import type { GuorinoChatMessage } from '@/lib/types/guorino-chat';

async function obtenerClienteId(usuarioId: bigint) {
  const cliente = await prisma.clientes.findFirst({
    where: { usuario_id: usuarioId },
    select: { id: true },
  });
  return cliente?.id ?? null;
}

export async function GET() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const clienteId = await obtenerClienteId(auth.user.id);
  if (!clienteId) {
    return NextResponse.json({ error: 'solo_clientes' }, { status: 403 });
  }

  const store = await listarConversacionesGuorino(clienteId);
  const activa = store.activa_id
    ? store.conversaciones.find((c) => c.id === store.activa_id) ?? null
    : await obtenerConversacionActivaGuorino(clienteId);

  return NextResponse.json({
    success: true,
    data: {
      activa_id: store.activa_id,
      conversaciones: store.conversaciones,
      conversacion_activa: activa,
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const clienteId = await obtenerClienteId(auth.user.id);
  if (!clienteId) {
    return NextResponse.json({ error: 'solo_clientes' }, { status: 403 });
  }

  const body = await req.json();
  const accion = body.accion as string;

  if (accion === 'nueva') {
    const conversacion = await iniciarConversacionGuorino(clienteId);
    return NextResponse.json({ success: true, data: conversacion });
  }

  if (accion === 'activar' && body.conversacion_id) {
    const conversacion = await activarConversacionGuorino(clienteId, String(body.conversacion_id));
    if (!conversacion) {
      return NextResponse.json({ error: 'conversacion_no_encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: conversacion });
  }

  if (accion === 'limpiar') {
    const store = await archivarConversacionActivaGuorino(clienteId);
    return NextResponse.json({ success: true, data: store });
  }

  if (accion === 'guardar' && body.conversacion_id && Array.isArray(body.mensajes)) {
    const conversacion = await guardarMensajesConversacionGuorino(
      clienteId,
      String(body.conversacion_id),
      body.mensajes as GuorinoChatMessage[],
    );
    if (!conversacion) {
      return NextResponse.json({ error: 'conversacion_no_encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: conversacion });
  }

  return NextResponse.json({ error: 'accion_invalida' }, { status: 400 });
}
