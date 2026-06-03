export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { asignarTallerConfeccionAyudante } from '@/lib/helpers/aprobar-confeccion-ayudante.helper';

const ROLES: RolUsuario[] = ['ayudante', 'administrador', 'gerente'];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const tallerId = body?.taller_id ?? body?.tallerId;

    if (!tallerId) {
      return NextResponse.json({ error: 'taller_id es requerido' }, { status: 400 });
    }

    const resultado = await asignarTallerConfeccionAyudante({
      confeccionId: BigInt(id),
      tallerId: BigInt(String(tallerId)),
    });

    return NextResponse.json({
      success: true,
      data: { taller_nombre: resultado.tallerNombre },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[PATCH ayudante/confecciones/taller]', error);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
