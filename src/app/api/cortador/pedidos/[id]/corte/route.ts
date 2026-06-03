export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { registrarCortePedidoCompletado } from '@/lib/helpers/registrar-corte-pedido.helper';

const ROLES_CORTE: RolUsuario[] = ['cortador', 'administrador', 'gerente'];

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_CORTE);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const notas = typeof body.notas === 'string' ? body.notas : undefined;

    const resultado = await registrarCortePedidoCompletado({
      pedidoId: BigInt(id),
      usuarioId: BigInt(auth.user.id),
      notas,
    });

    return NextResponse.json({
      success: true,
      data: {
        orden_id: String(resultado.ordenId),
        confeccion_id: String(resultado.confeccionId),
        taller: resultado.tallerNombre,
        ya_existia: resultado.corteYaRegistrado,
        orden_nueva: resultado.ordenNueva,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST cortador corte]', error);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
