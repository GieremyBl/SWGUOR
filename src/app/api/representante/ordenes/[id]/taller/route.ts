export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { reasignarTallerOrden } from '@/lib/helpers/representante-orden.helper';

const ROLES: RolUsuario[] = ['representante_taller', 'administrador', 'gerente'];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const tallerId = body.taller_id;

    if (!tallerId) {
      return NextResponse.json({ error: 'taller_id es requerido' }, { status: 400 });
    }

    const nombre = await reasignarTallerOrden({
      ordenId: BigInt(id),
      tallerId: BigInt(String(tallerId)),
      usuarioId: BigInt(auth.user.id),
    });

    return NextResponse.json({ success: true, data: { taller: nombre } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[PATCH representante taller]', error);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
