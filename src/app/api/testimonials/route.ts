import { NextResponse } from 'next/server';
import { prisma, prismaAvailable } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

export async function GET() {
  if (!prisma) {
    console.error('[testimonials] Prisma client not initialized');
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  if (!prismaAvailable) {
    console.error('[testimonials] Prisma client unavailable');
    return NextResponse.json(
      { error: 'Database client not initialized' },
      { status: 503 }
    );
  }

  try {
    const testimonials = await prisma.feedback_cliente.findMany({
      where: {
        estado: 'revisado',
        puntuacion: { gte: 4 },
        comentarios: { not: null },
      },
      include: {
        clientes: {
          select: {
            nombre_comercial: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 20,
    });

    return NextResponse.json(serializeBigInt(testimonials), {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('[testimonials] Query error:', {
      message: error?.message,
      code: error?.code,
      clientVersion: error?.clientVersion,
    });
    console.error('[testimonials] Full error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials', details: error?.message },
      { status: 500 }
    );
  }
}
