// app/api/admin/almacenes/[id]/stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { crearStockSchema } from '@/lib/schemas/almacenes';

type RouteContext = { params: Promise<{ id: string }> };

// ── Tipo inferido del include usado en las queries ─────────────────────────────
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
        // Determina el tipo de ítem
        tipo: item.producto_id ? 'producto' : item.insumo_id ? 'insumo' : 'material',
        // ✅ Renombra almacen_zonas → zona para el frontend
        zona: item.almacen_zonas
            ? { id: item.almacen_zonas.id.toString(), nombre: item.almacen_zonas.nombre }
            : null,
    };
}

// ── GET /api/admin/almacenes/[id]/stock?zona=&page=&limit= ────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
    const { id: rawId } = await params;   // ✅ await params (Next.js 15)
    let almacen_id: bigint;
    try { almacen_id = BigInt(rawId); } catch {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const zonaParam = searchParams.get('zona');
    const zona_id = zonaParam ? BigInt(zonaParam) : undefined;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Number(searchParams.get('limit') || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.almacen_stockWhereInput = {
        almacen_id,
        ...(zona_id !== undefined ? { zona_id } : {}),
    };

    try {
        const include = {
            almacen_zonas: { select: { id: true, nombre: true } },
        } satisfies Prisma.almacen_stockInclude;

        const [items, total] = await Promise.all([
            prisma.almacen_stock.findMany({
                where, skip, take: limit,
                orderBy: { updated_at: 'desc' },
                include,
            }),
            prisma.almacen_stock.count({ where }),
        ]);

        return NextResponse.json({
            data: items.map(serializeStock),
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('[GET stock]', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// ── POST /api/admin/almacenes/[id]/stock ──────────────────────────────────────
export async function POST(req: NextRequest, { params }: RouteContext) {
    const { id: rawId } = await params;   // ✅ await params (Next.js 15)
    let almacen_id: bigint;
    try { almacen_id = BigInt(rawId); } catch {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    try {
        const body = await req.json();
        const data = crearStockSchema.parse(body);

        const item = await prisma.almacen_stock.create({
            data: {
                almacen_id,
                zona_id: data.zona_id ? BigInt(data.zona_id) : null,
                producto_id: data.producto_id ? BigInt(data.producto_id) : null,
                insumo_id: data.insumo_id ? BigInt(data.insumo_id) : null,
                material_id: data.material_id ? BigInt(data.material_id) : null,
                cantidad: data.cantidad,
                stock_minimo: data.stock_minimo ?? 0,
            },
            include: { almacen_zonas: { select: { id: true, nombre: true } } },
        });

        return NextResponse.json(serializeStock(item), { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError)
            return NextResponse.json({ error: error.issues }, { status: 422 });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            return NextResponse.json({ error: 'Ya existe stock para ese ítem en esta zona' }, { status: 409 });
        console.error('[POST stock]', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}