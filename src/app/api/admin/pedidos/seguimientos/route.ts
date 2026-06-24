export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { requireServerRole } from '@/lib/auth/server';
import { NextResponse } from 'next/server';
import type { RolUsuario } from '@/lib/constants/roles';

const PEDIDOS_ROLES: RolUsuario[] = [
  'administrador', 'gerente', 'recepcionista',
  'disenador', 'cortador', 'representante_taller',
];

// GET /api/admin/pedidos/seguimiento?pedido_id=xxx
export async function GET(req: Request) {
  const auth = await requireServerRole(PEDIDOS_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const pedido_id = searchParams.get('pedido_id');
    if (!pedido_id) return NextResponse.json({ error: 'pedido_id requerido' }, { status: 400 });

    const seguimiento = await prisma.seguimiento_pedido.findMany({
      where: { pedido_id: BigInt(pedido_id) },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        status: true,
        notas: true,
        created_at: true,
        creado_por: true,
      },
    });

    return NextResponse.json({ success: true, data: seguimiento });
  } catch (error: any) {
    console.error('[GET /pedidos/seguimiento]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
