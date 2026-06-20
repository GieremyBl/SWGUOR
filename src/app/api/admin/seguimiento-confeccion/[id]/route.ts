export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { SeguimientoConfeccionService } from '@/lib/services/seguimiento-confeccion.service';
import { requireServerRole } from '@/lib/auth/server';
import { actualizarSeguimientoConfeccionSchema } from '@/lib/schemas/seguimiento-confeccion';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES_ESCRITURA: RolUsuario[] = [
  'administrador', 'gerente', 'disenador', 'cortador', 'representante_taller', 'ayudante',
];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = actualizarSeguimientoConfeccionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const data = await SeguimientoConfeccionService.actualizarNotas(
      id,
      parsed.data.notas ?? null,
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrado') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
