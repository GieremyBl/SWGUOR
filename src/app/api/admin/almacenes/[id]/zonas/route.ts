// app/api/admin/almacenes/[id]/zonas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { crearZonaSchema } from '@/lib/schemas/almacenes';

type RouteContext = { params: Promise<{ id: string }> };

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
        // ✅ Renombra _count.almacen_stock → _count.stock para el frontend
        _count: { stock: z._count.almacen_stock },
    };
}

// GET /api/admin/almacenes/[id]/zonas
export async function GET(_req: NextRequest, { params }: RouteContext) {
    const { id: rawId } = await params;
    let almacen_id: bigint;
    try { almacen_id = BigInt(rawId); } catch {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    try {
        const zonas = await prisma.almacen_zonas.findMany({
            where: { almacen_id },
            orderBy: { created_at: 'asc' },
            include: { _count: { select: { almacen_stock: true } } },
        });

        return NextResponse.json(zonas.map(serializeZona));
    } catch (error) {
        console.error('[GET zonas]', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// POST /api/admin/almacenes/[id]/zonas
export async function POST(req: NextRequest, { params }: RouteContext) {
    const { id: rawId } = await params;
    let almacen_id: bigint;
    try { almacen_id = BigInt(rawId); } catch {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    try {
        const body = await req.json();
        const data = crearZonaSchema.parse(body);

        const zona = await prisma.almacen_zonas.create({
            data: { ...data, almacen_id },
            include: { _count: { select: { almacen_stock: true } } },
        });

        return NextResponse.json(serializeZona(zona), { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError)
            return NextResponse.json({ error: error.issues }, { status: 422 });
        console.error('[POST zona]', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}