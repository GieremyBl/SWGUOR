export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

export async function GET(req: Request) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const limite = Math.min(Number(searchParams.get('limite') ?? 15), 50);

    const notificaciones = await prisma.notificaciones.findMany({
      where: { usuario_id: BigInt(auth.user.id) },
      orderBy: { created_at: 'desc' },
      take: limite,
    });

    const sinLeer = await prisma.notificaciones.count({
      where: { usuario_id: BigInt(auth.user.id), leido: false },
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInt(notificaciones),
      kpis: { sinLeer, total: notificaciones.length },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[GET /api/notificaciones]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await prisma.notificaciones.updateMany({
      where: { usuario_id: BigInt(auth.user.id), leido: false },
      data: { leido: true, leido_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
