export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { actualizarDireccionDespachoPedido } from '@/lib/helpers/pedido-direccion.helper';

type Params = { params: Promise<{ id: string }> };

/** Compatibilidad portal → delega en la misma lógica que /api/pedidos/[id]/direccion */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const cliente = await prisma.clientes.findFirst({
      where: { usuario_id: BigInt(auth.user.id) },
      select: { id: true },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'cliente_no_encontrado' }, { status: 404 });
    }

    const { id } = await params;
    const body = await req.json();

    const resultado = await actualizarDireccionDespachoPedido({
      pedidoId: BigInt(id),
      clienteId: cliente.id,
      direccion: String(body.direccion_despacho ?? ''),
    });

    if (!resultado.ok) {
      return NextResponse.json(
        {
          error: resultado.error,
          mensaje: 'mensaje' in resultado ? resultado.mensaje : undefined,
        },
        { status: resultado.status },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: Number(resultado.data.id),
        direccion_despacho: resultado.data.direccion_despacho,
        estado: resultado.data.estado,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
