export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { PedidosService } from '@/lib/services/pedidos.service';
import {
  actualizarDireccionDespachoPedido,
  puedeClienteEditarDireccionDespacho,
} from '@/lib/helpers/pedido-direccion.helper';

type Params = { params: Promise<{ id: string }> };

// GET /api/portal/pedidos/[id]
export async function GET(_req: Request, { params }: Params) {
    try {
        const auth = await requireServerAuth();
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const cliente = await prisma.clientes.findFirst({
            where: { usuario_id: BigInt(auth.user.id) },
            select: { id: true },
        });
        if (!cliente) {
            return NextResponse.json({ error: 'cliente_no_encontrado' }, { status: 404 });
        }

        const { id } = await params;
        const pedido = await PedidosService.obtenerPorId(id);

        if (!pedido || Number(pedido.cliente_id) !== Number(cliente.id)) {
            return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        }

        const despacho = await prisma.despachos.findFirst({
            where: { pedido_id: BigInt(id) },
            orderBy: { created_at: 'desc' },
            select: { estado: true },
        });

        const puedeEditarDireccion = puedeClienteEditarDireccionDespacho(
            pedido.estado,
            despacho?.estado,
        );

        return NextResponse.json({
            success: true,
            data: serializeBigInt({
                ...pedido,
                puede_editar_direccion: puedeEditarDireccion,
            }),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PATCH /api/portal/pedidos/[id]
export async function PATCH(req: Request, { params }: Params) {
    try {
        const auth = await requireServerAuth();
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const cliente = await prisma.clientes.findFirst({
            where: { usuario_id: BigInt(auth.user.id) },
            select: { id: true },
        });
        if (!cliente) {
            return NextResponse.json({ error: 'cliente_no_encontrado' }, { status: 404 });
        }

        const { id } = await params;
        const body = await req.json();

        const resultado = await actualizarDireccionDespachoPedido({
            pedidoId: BigInt(id),
            clienteId: cliente.id,
            direccion: String(body.direccion_despacho ?? ''),
        });

        if (!resultado.ok) {
            return NextResponse.json(
                {
                    error: resultado.error,
                    mensaje: 'mensaje' in resultado ? resultado.mensaje : undefined,
                },
                { status: resultado.status },
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: Number(resultado.data.id),
                direccion_despacho: resultado.data.direccion_despacho,
                estado: resultado.data.estado,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}