export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { verificarAccesoPedido } from '@/lib/helpers/pedido-acceso.helper';
import { actualizarDireccionDespachoPedido } from '@/lib/helpers/pedido-direccion.helper';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const pedidoId = BigInt(id);

    const acceso = await verificarAccesoPedido(pedidoId, auth.user);
    if (!acceso.ok || !acceso.esClienteDueño) {
      return NextResponse.json({ error: 'sin_permisos' }, { status: 403 });
    }

    const cliente = await prisma.clientes.findFirst({
      where: { usuario_id: BigInt(auth.user.id) },
      select: { id: true },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'cliente_no_encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const direccion = String(body.direccion_despacho ?? '');

    const resultado = await actualizarDireccionDespachoPedido({
      pedidoId,
      clienteId: cliente.id,
      direccion,
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
    console.error('[PATCH /api/pedidos/:id/direccion]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
