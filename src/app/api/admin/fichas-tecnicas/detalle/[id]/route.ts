export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { FichasTecnicasDetalleService } from '@/lib/services/fichas-tecnicas-detalle.service';
import { requireServerRole } from '@/lib/auth/server';
import { fichaDetalleItemSchema } from '@/lib/schemas/fichas-tecnicas-detalle';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES: RolUsuario[] = ['disenador', 'cortador', 'administrador', 'gerente'];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = fichaDetalleItemSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const data = await FichasTecnicasDetalleService.actualizarItem(id, parsed.data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrado') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
