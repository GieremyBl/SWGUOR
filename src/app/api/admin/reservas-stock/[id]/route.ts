export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reservaStockBaseSchema as reservasStockUpdateSchema } from '@/lib/schemas/reserva-stock';
import { serializeBigInt } from '@/lib/utils/serialize';
import { ZodError } from 'zod';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reserva = await prisma.reservas_stock.findUnique({
      where: { id: BigInt(id) },
      include: { variantes_producto: true, cotizaciones: true, pedidos: true },
    });
    if (!reserva) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }
    return NextResponse.json(serializeBigInt(reserva));
  } catch (error: any) {
    console.error('[GET /reservas-stock/:id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = reservasStockUpdateSchema.parse(body);

    const reserva = await prisma.reservas_stock.update({
      where: { id: BigInt(id) },
      data: {
        ...(validated.pedido_id ? { pedido_id: BigInt(validated.pedido_id) } : {}),
        ...(validated.estado ? { estado: validated.estado } : {}),
      },
      include: { pedidos: true },
    });

    return NextResponse.json(serializeBigInt(reserva));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('[PUT /reservas-stock/:id]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.reservas_stock.update({
      where: { id: BigInt(id) },
      data: { estado: 'cancelada' },
    });
    return NextResponse.json({ success: true, mensaje: 'Reserva liberada (cancelada)' });
  } catch (error: any) {
    console.error('[DELETE /reservas-stock/:id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}