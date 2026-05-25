export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { reglaDescuentoSchema } from '@/lib/schemas/promociones-ofertas';
import { reglasDescuentoService } from '@/lib/services/reglas-descuento.service';
import { serializeBigInt } from '@/lib/utils/serialize';

const ROLES: RolUsuario[] = ['administrador', 'gerente'];

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const regla = await reglasDescuentoService.obtenerPorId(BigInt(id));
    if (!regla) {
      return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: serializeBigInt(regla) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = reglaDescuentoSchema.safeParse({ ...body, id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const updated = await reglasDescuentoService.actualizar(BigInt(id), parsed.data);
    return NextResponse.json({ success: true, data: serializeBigInt(updated) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const updated = await reglasDescuentoService.desactivar(BigInt(id));
    return NextResponse.json({
      success: true,
      message: 'Regla desactivada',
      data: serializeBigInt(updated),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
