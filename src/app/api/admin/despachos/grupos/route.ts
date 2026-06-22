export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { ROLES_LOGISTICA_DESPACHO } from '@/lib/constants/pedidos-logistica';
import { agruparDespachosEnRuta } from '@/lib/helpers/agrupar-despachos.helper';
import { agruparDespachosSchema } from '@/lib/schemas/despachos-grupo';

export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES_LOGISTICA_DESPACHO);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = agruparDespachosSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const despachoIds = parsed.data.despacho_ids.map((id) => BigInt(id));
    const paradas = parsed.data.paradas?.map((p) => ({
      despacho_id: BigInt(p.despacho_id),
      numero_parada: p.numero_parada,
    }));

    const resultado = await agruparDespachosEnRuta({
      despachoIds,
      paradas,
      creadoPorAuthId: auth.user.authId ?? null,
    });

    return NextResponse.json({
      success: true,
      data: {
        grupo_id: String(resultado.grupoId),
        despacho_ids: resultado.despachoIds.map(String),
        total_paradas: resultado.despachoIds.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST admin/despachos/grupos]', error);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
