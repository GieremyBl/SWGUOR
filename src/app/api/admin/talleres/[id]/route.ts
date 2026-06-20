export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { TalleresService } from '@/lib/services/talleres.service';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { tallerUpdateSchema } from '@/lib/schemas/talleres';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES_LECTURA: RolUsuario[] = ['administrador', 'gerente', 'representante_taller', 'almacenero'];
const ROLES_ESCRITURA: RolUsuario[] = ['administrador', 'gerente'];

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_LECTURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const taller = await TalleresService.obtenerPorId(id);
    if (!taller) {
      return NextResponse.json({ error: 'Taller no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: taller });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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
    const parsed = tallerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const taller = await TalleresService.actualizar(id, parsed.data);

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'ACTUALIZAR',
      tabla: 'talleres',
      registro_id: BigInt(id),
      datos_despues: taller,
    });

    return NextResponse.json({ success: true, data: taller });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const code = (error as { code?: string })?.code;
    const status = code === 'P2025' ? 404 : code === 'P2002' ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
