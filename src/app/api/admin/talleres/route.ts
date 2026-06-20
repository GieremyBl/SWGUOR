export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { TalleresService } from '@/lib/services/talleres.service';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { tallerSchema } from '@/lib/schemas/talleres';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES_LECTURA: RolUsuario[] = ['administrador', 'gerente', 'representante_taller', 'almacenero'];
const ROLES_ESCRITURA: RolUsuario[] = ['administrador', 'gerente'];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES_LECTURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? undefined;
    const estado = searchParams.get('estado') ?? undefined;

    const data = await TalleresService.listar({ search, estado });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = tallerSchema.omit({ id: true }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const taller = await TalleresService.crear(parsed.data);

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'CREAR',
      tabla: 'talleres',
      registro_id: BigInt(taller.id),
      datos_despues: taller,
    });

    return NextResponse.json({ success: true, data: taller }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const code = (error as { code?: string })?.code;
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un taller con ese RUC o email' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'id numérico requerido' }, { status: 400 });
    }

    const taller = await TalleresService.desactivar(id);

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'ELIMINAR',
      tabla: 'talleres',
      registro_id: BigInt(id),
    });

    return NextResponse.json({ success: true, message: 'Taller desactivado', data: taller });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = (error as { code?: string })?.code === 'P2025' ? 404 : 500;
    return NextResponse.json({ error: msg }, { status: status });
  }
}
