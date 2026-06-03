export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const notifId = BigInt(id);

    const actualizada = await prisma.notificaciones.updateMany({
      where: {
        id: notifId,
        usuario_id: BigInt(auth.user.id),
      },
      data: { leido: true, leido_at: new Date() },
    });

    if (actualizada.count === 0) {
      return NextResponse.json({ error: 'notificacion_no_encontrada' }, { status: 404 });
    }

    const data = await prisma.notificaciones.findUnique({
      where: { id: notifId },
    });

    return NextResponse.json({ ok: true, data: serializeBigInt(data) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[PATCH /api/notificaciones/:id/leer]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
