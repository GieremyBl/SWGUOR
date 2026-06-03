export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { iniciarRutaDespacho } from '@/lib/helpers/iniciar-ruta-despacho.helper';

const ROLES: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
  'ayudante',
  'representante_taller',
  'almacenero',
];

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
