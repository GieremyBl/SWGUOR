import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { actualizarStockSchema } from '@/lib/schemas/almacenes';

type RouteContext = { params: Promise<{ id: string; stockId: string }> };

type StockWithZona = Prisma.almacen_stockGetPayload<{
    include: { almacen_zonas: { select: { id: true; nombre: true } } };
}>;

function serializeStock(item: StockWithZona) {
    return {
        id: item.id.toString(),
        almacen_id: item.almacen_id.toString(),
        zona_id: item.zona_id?.toString() ?? null,
        producto_id: item.producto_id?.toString() ?? null,
        insumo_id: item.insumo_id?.toString() ?? null,
        material_id: item.material_id?.toString() ?? null,
        cantidad: Number(item.cantidad),
        stock_minimo: item.stock_minimo != null ? Number(item.stock_minimo) : null,
        updated_at: item.updated_at.toISOString(),
        tipo: item.producto_id ? 'producto' : item.insumo_id ? 'insumo' : 'material',
        zona: item.almacen_zonas
            ? { id: item.almacen_zonas.id.toString(), nombre: item.almacen_zonas.nombre }
            : null,
    };
}

// PUT /api/admin/almacenes/[id]/stock/[stockId]
export async function PUT(req: NextRequest, { params }: RouteContext) {
    const { stockId } = await params;
    let id: bigint;
    try { id = BigInt(stockId); } catch {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    try {
        const body = await req.json();
        const data = actualizarStockSchema.parse(body);

        const item = await prisma.almacen_stock.update({
            where: { id },
            data: {
                ...(data.cantidad !== undefined ? { cantidad: data.cantidad } : {}),
                ...(data.stock_minimo !== undefined ? { stock_minimo: data.stock_minimo } : {}),
                ...(data.zona_id !== undefined ? { zona_id: data.zona_id ? BigInt(data.zona_id) : null } : {}),
            },
            include: { almacen_zonas: { select: { id: true, nombre: true } } },
        });

        return NextResponse.json(serializeStock(item));
    } catch (error) {
        if (error instanceof z.ZodError)
            return NextResponse.json({ error: error.issues }, { status: 422 });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
            return NextResponse.json({ error: 'Item de stock no encontrado' }, { status: 404 });
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// DELETE /api/admin/almacenes/[id]/stock/[stockId]
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
    const { stockId } = await params;
    let id: bigint;
    try { id = BigInt(stockId); } catch {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    try {
        await prisma.almacen_stock.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
            return NextResponse.json({ error: 'Item de stock no encontrado' }, { status: 404 });
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}