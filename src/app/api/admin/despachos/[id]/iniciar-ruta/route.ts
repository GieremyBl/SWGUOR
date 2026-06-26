export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { ROLES_LOGISTICA_DESPACHO } from '@/lib/constants/pedidos-logistica';
import type { RolUsuario } from '@/lib/constants/roles';
import { iniciarRutaDespacho } from '@/lib/helpers/iniciar-ruta-despacho.helper';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_LOGISTICA_DESPACHO);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ROLES_INICIO_RUTA: RolUsuario[] = ['ayudante', 'administrador', 'gerente'];
  if (!ROLES_INICIO_RUTA.includes(auth.user.rol)) {
    return NextResponse.json(
      { error: 'Solo ayudante, administrador o gerente pueden iniciar ruta de despacho.' },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const resultado = await iniciarRutaDespacho({
      despachoId: BigInt(id),
      creadoPorAuthId: auth.user.authId ?? null,
    });

    return NextResponse.json({
      success: true,
      data: {
        despacho_id: String(resultado.despachoId),
        grupo_id: String(resultado.grupoId),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST admin/despachos/iniciar-ruta]', error);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
