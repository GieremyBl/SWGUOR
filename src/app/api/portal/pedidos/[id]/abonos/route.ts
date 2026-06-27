import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
    try {
        const { id } = await params;
        const pedidoId = BigInt(id);

        // Verificar si el modelo existe en el cliente Prisma antes de consultar.
        // abonos_pedido aún no está en el schema → devolvemos [] hasta que exista.
        const model = (prisma as any).abonos_pedido;
        if (!model) {
            return NextResponse.json([]);
        }

        const abonos = await model.findMany({
            where: { pedido_id: pedidoId },
            orderBy: { fecha_pago: 'desc' },
        });

        return NextResponse.json(serializeBigInt(abonos));
    } catch (error: any) {
        console.error('[API] abonos_pedido:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}