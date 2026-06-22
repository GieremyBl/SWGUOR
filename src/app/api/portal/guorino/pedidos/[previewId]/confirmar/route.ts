export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { confirmarPedidoGuorino } from '@/lib/services/guorino-pedido.service';

type Params = { params: Promise<{ previewId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const cliente = await prisma.clientes.findFirst({
    where: { usuario_id: auth.user.id },
    select: { id: true },
  });

  if (!cliente) {
    return NextResponse.json({ error: 'solo_clientes' }, { status: 403 });
  }

  try {
    const { previewId } = await params;
    const resultado = await confirmarPedidoGuorino({
      clienteId: cliente.id,
      usuarioId: auth.user.id,
      previewId,
    });

    return NextResponse.json({
      success: true,
      data: { pedido_id: String(resultado.pedidoId) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al confirmar pedido';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
