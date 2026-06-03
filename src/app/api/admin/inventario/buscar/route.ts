// Busca en las 3 tablas a la vez
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const tipo = searchParams.get('tipo'); // 'producto' | 'insumo' | 'material' | null

    if (q.length < 2)
        return NextResponse.json([]);

    try {
        const [productos, insumos, materiales] = await Promise.all([
            (!tipo || tipo === 'producto')
                ? prisma.productos.findMany({
                    where: { nombre: { contains: q, mode: 'insensitive' } },
                    select: { id: true, nombre: true },
                    take: 10,
                })
                : [],
            (!tipo || tipo === 'insumo')
                ? prisma.insumo.findMany({
                    where: { nombre: { contains: q, mode: 'insensitive' } },
                    select: { id: true, nombre: true },
                    take: 10,
                })
                : [],
            (!tipo || tipo === 'material')
                ? prisma.materiales.findMany({
                    where: { nombre: { contains: q, mode: 'insensitive' } },
                    select: { id: true, nombre: true },
                    take: 10,
                })
                : [],
        ]);

        return NextResponse.json([
            ...productos.map(p => ({ id: Number(p.id), nombre: p.nombre, tipo: 'producto' as const })),
            ...insumos.map(i => ({ id: Number(i.id), nombre: i.nombre, tipo: 'insumo' as const })),
            ...materiales.map(m => ({ id: Number(m.id), nombre: m.nombre, tipo: 'material' as const })),
        ]);
    } catch (error) {
        console.error('[GET inventario/buscar]', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}