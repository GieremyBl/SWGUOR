import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { buildPedidoItemsFromCotizacion } from '@/lib/helpers/crear-pedido-items-desde-cotizacion.helper';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { id } = await params;
        const cotizacionId = Number(id);
        if (isNaN(cotizacionId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        // 1. Usuario interno
        const usuario = await prisma.usuarios.findFirst({
            where: { auth_id: user.id },
            select: { id: true },
        });
        if (!usuario) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // 2. Cliente vinculado al usuario
        const cliente = await prisma.clientes.findFirst({
            where: { usuario_id: usuario.id },
            select: { id: true },
        });
        if (!cliente) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }

        // 3. Cotización con sus items
        const cotizacion = await prisma.cotizaciones.findUnique({
            where: { id: cotizacionId },
            include: { cotizacion_items: true },
        });
        if (!cotizacion) {
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }
        if (Number(cotizacion.cliente_id) !== Number(cliente.id)) {
            return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
        }

        // 4. Validar estado
        const ESTADOS_CONVERTIBLES = ['enviada', 'aprobada'];
        if (!ESTADOS_CONVERTIBLES.includes(cotizacion.estado ?? '')) {
            return NextResponse.json(
                { error: 'estado_invalido', detalle: `La cotización está en estado "${cotizacion.estado}"` },
                { status: 422 },
            );
        }

        // 5. Verificar que no exista pedido previo
        const pedidoExistente = await prisma.pedidos.findFirst({
            where: { cotizacion_id: cotizacionId },
        });
        if (pedidoExistente) {
            return NextResponse.json(
                { error: 'ya_convertida', detalle: `Ya existe el pedido #${pedidoExistente.id}` },
                { status: 409 },
            );
        }

        // 6. Transacción atómica
        const resultado = await prisma.$transaction(async (tx) => {
            const pedido = await tx.pedidos.create({
                data: {
                    cliente_id: cliente.id,
                    cotizacion_id: cotizacion.id,
                    created_by: usuario.id,
                    estado: 'pendiente',
                    subtotal: cotizacion.subtotal ?? 0,
                    igv: cotizacion.igv ?? 0,
                    total: cotizacion.total ?? 0,
                    monto_descuento: cotizacion.monto_descuento ?? 0,
                    costo_envio: cotizacion.costo_envio ?? 0,
                    total_estimado: cotizacion.total ?? 0,
                    direccion_despacho: cotizacion.direccion_despacho ?? null,
                    moneda: cotizacion.moneda,
                    moq_aplicado: 400,
                    total_unidades: cotizacion.cotizacion_items.reduce(
                        (s, i) => s + (i.cantidad ?? 0), 0
                    ),
                },
            });

            if (cotizacion.cotizacion_items.length > 0) {
                await tx.pedido_items.createMany({
                    data: buildPedidoItemsFromCotizacion(pedido.id, cotizacion.cotizacion_items),
                });
            }

            await tx.cotizaciones.update({
                where: { id: cotizacionId },
                data: {
                    estado: 'convertida',
                    aprobado_at: new Date(),
                },
            });

            return pedido;
        });

        return NextResponse.json({
            ok: true,
            data: { pedido_id: Number(resultado.id) },
        });

    } catch (err: any) {
        console.error('[confirmar-cotizacion]', err);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}