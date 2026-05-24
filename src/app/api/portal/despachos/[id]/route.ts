import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const usuario = await prisma.usuarios.findUnique({
            where: { auth_id: user.id },
            select: { clientes: { select: { id: true } } },
        });

        const clienteId = usuario?.clientes?.id;
        if (!clienteId) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }

        const grupoId = Number(id);

        const pertenece = await prisma.despachos_grupo_pedidos.findFirst({
            where: {
                grupo_despacho_id: grupoId,
                pedidos: { cliente_id: clienteId },
            },
        });

        if (!pertenece) {
            return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        }

        const grupo = await prisma.despachos_grupos.findUnique({
            where: { id: grupoId },
            include: {
                despachos_grupo_pedidos: true,
                seguimiento_despachos: {
                    orderBy: { created_at: 'desc' },
                    take: 5,
                },
            },
        });

        if (!grupo) {
            return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        }

        return NextResponse.json(grupo);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error interno';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}