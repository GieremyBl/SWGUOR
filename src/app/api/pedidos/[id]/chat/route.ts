export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { verificarAccesoPedido } from '@/lib/helpers/pedido-acceso.helper';
import {
  isPedidoChatError,
  listarMensajesChatPedido,
  procesarMensajeChatPedido,
} from '@/lib/services/pedido-chat.service';

type Params = { params: Promise<{ id: string }> };

function parsePedidoId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const pedidoId = parsePedidoId(id);
    if (!pedidoId) {
      return NextResponse.json({ error: 'id_invalido' }, { status: 400 });
    }

    const acceso = await verificarAccesoPedido(pedidoId, auth.user);
    if (!acceso.ok) {
      return NextResponse.json(
        { error: acceso.status === 404 ? 'pedido_no_encontrado' : 'sin_permisos' },
        { status: acceso.status },
      );
    }

    const mensajes = await listarMensajesChatPedido(pedidoId);

    return NextResponse.json({ success: true, data: mensajes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[GET /api/pedidos/:id/chat]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const pedidoId = parsePedidoId(id);
    if (!pedidoId) {
      return NextResponse.json({ error: 'id_invalido' }, { status: 400 });
    }

    const acceso = await verificarAccesoPedido(pedidoId, auth.user);
    if (!acceso.ok) {
      return NextResponse.json(
        { error: acceso.status === 404 ? 'pedido_no_encontrado' : 'sin_permisos' },
        { status: acceso.status },
      );
    }

    const body = await req.json();
    const contenido = typeof body.contenido === 'string' ? body.contenido : '';
    const emisor = typeof body.emisor === 'string' ? body.emisor : '';
    const solicita_humano = Boolean(body.solicita_humano);

    const resultado = await procesarMensajeChatPedido({
      pedidoId,
      auth: auth.user,
      modo: acceso.modo,
      esClienteDueño: acceso.esClienteDueño,
      contenido,
      emisor,
      solicita_humano,
    });

    return NextResponse.json({ success: true, data: resultado.mensajes });
  } catch (error: unknown) {
    if (isPedidoChatError(error)) {
      return NextResponse.json({ error: error.code, message: error.message }, {
        status: error.status,
      });
    }
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST /api/pedidos/:id/chat]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
