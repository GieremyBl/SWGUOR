export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guiaRemisionBaseSchema } from '@/lib/schemas/guias-remision';
import { serializeBigInt } from '@/lib/utils/serialize';
import { ZodError } from 'zod';

/**
 * GET /api/despachos/[id]/guia-remision
 * Obtiene guía(s) de remisión asociada a un despacho
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Buscar guías por despacho_id
        const guias = await prisma.guias_remision.findMany({
            where: { id: BigInt(id) },
            include: { guias_remision_items: true, pedidos: true },
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json({ data: serializeBigInt(guias) });
    } catch (error: any) {
        console.error('[GET /api/despachos/:id/guia-remision]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/despachos/[id]/guia-remision
 * Crea una nueva guía de remisión para un despacho
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: despacho_id } = await params;
        const body = await request.json();

        // Validar datos entrantes
        const validated = guiaRemisionBaseSchema.parse(body);

        // Crear guía de remisión
        const guia = await prisma.guias_remision.create({
            data: {
                numero: validated.numero,
                tipo: validated.tipo,
                estado: validated.estado || 'borrador',
                origen_tipo: validated.origen_tipo,
                origen_id: validated.origen_id ? BigInt(validated.origen_id) : null,
                origen_direccion: validated.origen_direccion,
                destino_tipo: validated.destino_tipo,
                destino_id: validated.destino_id ? BigInt(validated.destino_id) : null,
                destino_direccion: validated.destino_direccion,
                pedido_id: validated.pedido_id ? BigInt(validated.pedido_id) : null,
                orden_produccion_id: validated.orden_produccion_id
                    ? BigInt(validated.orden_produccion_id)
                    : null,
                transportista: validated.transportista ?? null,
                ruc_transportista: validated.ruc_transportista ?? null,
                placa_vehiculo: validated.placa_vehiculo ?? null,
                fecha_traslado: new Date(validated.fecha_traslado),
                fecha_entrega: validated.fecha_entrega ? new Date(validated.fecha_entrega) : null,
                motivo_traslado: validated.motivo_traslado ?? null,
                observaciones: validated.observaciones ?? null,
                pdf_url: validated.pdf_url ?? null,
                emitido_por: validated.emitido_por ? BigInt(validated.emitido_por) : null,
            },
            include: { guias_remision_items: true, pedidos: true },
        });

        // TODO: Crear items de la guía si se proporciona en validated.items
        // await prisma.guias_remision_items.createMany({
        //   data: validated.items?.map((item) => ({
        //     guia_id: guia.id,
        //     ...item,
        //   })) || [],
        // });

        return NextResponse.json(serializeBigInt(guia), { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: error.issues },
                { status: 400 }
            );
        }
        console.error('[POST /api/despachos/:id/guia-remision]', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

/**
 * PUT /api/despachos/[id]/guia-remision
 * Actualiza una guía de remisión existente
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guia_id } = await params;
        const body = await request.json();

        const validated = guiaRemisionBaseSchema.parse(body);

        const guia = await prisma.guias_remision.update({
            where: { id: BigInt(guia_id) },
            data: {
                ...(validated.pedido_id ? { pedido_id: BigInt(validated.pedido_id) } : {}),
                ...(validated.tipo ? { tipo: validated.tipo } : {}),
                ...(validated.estado ? { estado: validated.estado } : {}),
                ...(validated.fecha_traslado ? { fecha_traslado: new Date(validated.fecha_traslado) } : {}),
                ...(validated.destino_direccion ? { destino_direccion: validated.destino_direccion } : {}),
                ...(validated.origen_direccion ? { origen_direccion: validated.origen_direccion } : {}),
                observaciones: validated.observaciones,
            },
            include: { guias_remision_items: true, pedidos: true },
        });

        return NextResponse.json(serializeBigInt(guia));
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: error.issues },
                { status: 400 }
            );
        }
        console.error('[PUT /api/despachos/:id/guia-remision]', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

/**
 * DELETE /api/despachos/[id]/guia-remision
 * Elimina una guía de remisión y sus items
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: guia_id } = await params;

        await prisma.guias_remision_items.deleteMany({
            where: { guia_id: BigInt(guia_id) },
        });

        await prisma.guias_remision.delete({
            where: { id: BigInt(guia_id) },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[DELETE /api/despachos/:id/guia-remision]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}