export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { reglaDescuentoSchema } from '@/lib/schemas/promociones-ofertas';
import { reglasDescuentoService } from '@/lib/services/reglas-descuento.service';
import { serializeBigInt } from '@/lib/utils/serialize';

const ROLES: RolUsuario[] = ['administrador', 'gerente'];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);

    if (searchParams.get('activas') === '1') {
      const data = await reglasDescuentoService.listarActivas();
      return NextResponse.json({ success: true, data: serializeBigInt(data) });
    }

    const activoParam = searchParams.get('activo');
    const result = await reglasDescuentoService.listar({
      busqueda: searchParams.get('busqueda') ?? undefined,
      activo:
        activoParam === 'true'
          ? true
          : activoParam === 'false'
            ? false
            : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInt(result.data),
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = reglaDescuentoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const created = await reglasDescuentoService.crear(parsed.data);
    return NextResponse.json(
      { success: true, data: serializeBigInt(created) },
      { status: 201 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
