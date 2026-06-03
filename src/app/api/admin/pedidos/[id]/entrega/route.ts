export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { confirmarEntregaPedido } from '@/lib/helpers/confirmar-entrega-pedido.helper';

const ROLES: RolUsuario[] = ['administrador', 'gerente'];

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const actaPdfUrl = typeof body.acta_pdf_url === 'string' ? body.acta_pdf_url : '';
    const fotos = Array.isArray(body.fotos)
      ? body.fotos.filter((u: unknown) => typeof u === 'string')
      : [];

    const resultado = await confirmarEntregaPedido({
      pedidoId: BigInt(id),
      actaPdfUrl,
      fotosEntrega: fotos,
      notasEntrega: typeof body.notas === 'string' ? body.notas : undefined,
      emitidoPor: BigInt(auth.user.id),
      creadoPorAuthId: auth.user.authId,
    });

    return NextResponse.json({
      success: true,
      data: {
        despacho_id: String(resultado.despachoId),
        guia_id: String(resultado.guiaId),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST pedido entrega]', error);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
