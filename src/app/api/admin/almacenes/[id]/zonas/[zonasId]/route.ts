import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { actualizarZonaSchema } from '@/lib/schemas/almacenes';

type RouteContext = {
    params: Promise<{ id: string; zonasId: string }>;
};

type ZonaWithCount = Prisma.almacen_zonasGetPayload<{
    include: { _count: { select: { almacen_stock: true } } };
}>;

function serializeZona(z: ZonaWithCount) {
    return {
        id: z.id.toString(),
        almacen_id: z.almacen_id.toString(),
        nombre: z.nombre,
        descripcion: z.descripcion ?? null,
        created_at: z.created_at.toISOString(),
        _count: { stock: z._count.almacen_stock },
    };
}

// PUT /api/admin/almacenes/[id]/zonas/[zonasId]
export async function PUT(req: NextRequest, { params }: RouteContext) {
    // 2. Extraer 'zonasId' de la promesa
    const { zonasId } = await params;
    let id: bigint;
    try {
        id = BigInt(zonasId);
    } catch {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    try {
        const body = await req.json();
        const data = actualizarZonaSchema.parse(body);

        const zona = await prisma.almacen_zonas.update({
            where: { id },
            data,
            include: { _count: { select: { almacen_stock: true } } },
        });

        return NextResponse.json(serializeZona(zona));
    } catch (error) {
        if (error instanceof z.ZodError)
            return NextResponse.json({ error: error.issues }, { status: 422 });
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// DELETE /api/admin/almacenes/[id]/zonas/[zonasId]
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
    // 3. Extraer 'zonasId' de la promesa
    const { zonasId } = await params;
    let id: bigint;
    try {
        id = BigInt(zonasId);
    } catch {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    try {
        await prisma.almacen_zonas.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
            return NextResponse.json({ error: 'Zona no encontrada' }, { status: 404 });
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}