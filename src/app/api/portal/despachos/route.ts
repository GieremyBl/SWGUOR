import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { serializeBigInt } from '@/lib/utils/serialize';

export async function GET(req: NextRequest) {
    try {
        // 1. Verificar sesión
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // 2. Obtener el cliente asociado al usuario autenticado
        const usuario = await prisma.usuarios.findUnique({
            where: { auth_id: user.id },
            select: {
                clientes: { select: { id: true } },
            },
        });

        const clienteId = usuario?.clientes?.id;
        if (!clienteId) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }

        // 3. Obtener los grupo_despacho_ids del cliente
        const grupoPedidos = await prisma.despachos_grupo_pedidos.findMany({
            where: {
                pedidos: { cliente_id: clienteId },
            },
            select: { grupo_despacho_id: true },
            distinct: ['grupo_despacho_id'],
        });

        const grupoIds = grupoPedidos.map(g => g.grupo_despacho_id);
        if (grupoIds.length === 0) {
            return NextResponse.json([]);
        }

        // 4. Obtener los grupos activos con sus relaciones
        const grupos = await prisma.despachos_grupos.findMany({
            where: {
                id: { in: grupoIds },
                NOT: { estado: 'entregado' },
            },
            include: {
                despachos_grupo_pedidos: {
                    select: {
                        id: true,
                        grupo_despacho_id: true,
                        despacho_id: true,
                        pedido_id: true,
                        created_at: true,
                    },
                },
                seguimiento_despachos: {
                    orderBy: { created_at: 'desc' },
                    take: 5, // últimos 5 seguimientos
                },
            },
            orderBy: { id: 'desc' },
        });

        return NextResponse.json(serializeBigInt(grupos));
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error interno';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}