export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { obtenerPagosPedidoPortal } from '@/lib/services/portal-pedido-pagos.service';

type Params = { params: Promise<{ id: string }> };

async function resolverClienteAutenticado() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { error: auth.error, status: auth.status } as const;
  }

  const cliente = await prisma.clientes.findFirst({
    where: { usuario_id: BigInt(auth.user.id) },
    select: { id: true, estado: true },
  });

  if (!cliente) {
    return { error: 'cliente_no_encontrado', status: 404 } as const;
  }

  if (cliente.estado !== 'activo') {
    return { error: 'cliente_inactivo', status: 403 } as const;
  }

  return { cliente_id: cliente.id } as const;
}

/** GET /api/portal/pedidos/[id]/pagos */
export async function GET(_req: Request, { params }: Params) {
  try {
    const sesion = await resolverClienteAutenticado();
    if ('error' in sesion) {
      return NextResponse.json(
        { success: false, error: sesion.error },
        { status: sesion.status },
      );
    }

    const { id } = await params;
    const pedidoId = BigInt(id);

    if (Number.isNaN(Number(id)) || pedidoId <= BigInt(0)) {
      return NextResponse.json(
        { success: false, error: 'pedido_id_invalido' },
        { status: 400 },
      );
    }

    const data = await obtenerPagosPedidoPortal(pedidoId, sesion.cliente_id);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'pedido_no_encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Portal] GET pedidos/[id]/pagos:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
