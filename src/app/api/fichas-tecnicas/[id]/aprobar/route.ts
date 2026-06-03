export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { aprobarFichaItemPedido } from '@/lib/helpers/ficha-tecnica-pedido.helper';

const ROLES: RolUsuario[] = ['disenador', 'administrador', 'gerente'];

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const pedidoId = body.pedido_id ?? body.pedidoId;

    if (!pedidoId) {
      return NextResponse.json({ error: 'pedido_id es requerido' }, { status: 400 });
    }

    const resultado = await aprobarFichaItemPedido({
      fichaId: BigInt(id),
      pedidoId: BigInt(String(pedidoId)),
      usuarioId: BigInt(auth.user.id),
    });

    return NextResponse.json({
      success: true,
      data: {
        pedido_en_produccion: resultado.pedidoEnProduccion,
        progreso: resultado.progreso,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST fichas-tecnicas aprobar]', error);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
