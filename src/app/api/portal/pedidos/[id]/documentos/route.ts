export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { obtenerClientePortalSesion } from '@/lib/helpers/portal-cliente.helper';
import { prisma } from '@/lib/prisma';
import {
  DocumentosService,
  isDocumentosPedidoError,
} from '@/lib/services/documentos.service';

type Params = { params: Promise<{ id: string }> };

/** GET /api/portal/pedidos/[id]/documentos */
export async function GET(_req: Request, { params }: Params) {
  try {
    const sesion = await obtenerClientePortalSesion();
    if ('error' in sesion) {
      return NextResponse.json(
        { success: false, error: sesion.error },
        { status: sesion.status },
      );
    }

    const { id } = await params;
    const pedidoId = BigInt(id);

    if (!id.trim() || Number.isNaN(Number(id)) || pedidoId <= BigInt(0)) {
      return NextResponse.json(
        { success: false, error: 'pedido_id_invalido' },
        { status: 400 },
      );
    }

    const pedido = await prisma.pedidos.findFirst({
      where: {
        id: pedidoId,
        cliente_id: sesion.cliente_id,
      },
      select: { id: true },
    });

    if (!pedido) {
      return NextResponse.json(
        { success: false, error: 'pedido_no_encontrado' },
        { status: 404 },
      );
    }

    const documentos = await DocumentosService.obtenerExpedientePedido(id);

    return NextResponse.json({ success: true, data: documentos }, { status: 200 });
  } catch (error) {
    if (isDocumentosPedidoError(error)) {
      const status = error.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status },
      );
    }

    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Portal] GET pedidos/[id]/documentos:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
