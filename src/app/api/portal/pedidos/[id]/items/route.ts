import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
    try {
        const { id } = await params;
        const pedidoId = BigInt(id);

        const items = await prisma.pedido_items.findMany({
            where: { pedido_id: pedidoId },
            include: {
                productos: true,         // todos los campos del producto
                variantes_producto: true, // todos los campos de la variante
            },
            orderBy: { id: 'asc' },
        });

        return NextResponse.json(serializeBigInt(items));
    } catch (error: any) {
        console.error('[API] pedido_items:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}