export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { TarifasTallerService } from '@/lib/services/tarifa-talleres.service';
import { requireServerRole } from '@/lib/auth/server';
import { tarifaTallerSchema } from '@/lib/schemas/tarifa-talleres';
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
    const taller_id = searchParams.get('taller_id') ?? undefined;
    const especialidad = searchParams.get('especialidad') ?? undefined;
    const activoParam = searchParams.get('activo');
    const activo = activoParam === null ? 'all' as const
      : activoParam === 'true' ? true
      : activoParam === 'false' ? false
      : 'all' as const;

    const data = await TarifasTallerService.listar({
      taller_id,
      especialidad,
      activo,
    });

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
    const parsed = tarifaTallerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const data = await TarifasTallerService.crear(parsed.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('Ya existe') || msg.includes('no encontrado') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
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

    const data = await TarifasTallerService.desactivar(id);
    return NextResponse.json({ success: true, message: 'Tarifa desactivada', data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrada') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
