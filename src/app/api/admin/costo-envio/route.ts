export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  COSTO_ENVIO_ROLES_ESCRITURA,
  COSTO_ENVIO_ROLES_VER,
} from '@/lib/constants/costo-envio';
import { crearCostoEnvioSchema } from '@/lib/schemas/costo-envio';
import { CostoEnvioService } from '@/lib/services/costo-envio.service';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  const auth = await requireServerRole(COSTO_ENVIO_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const activoParam = searchParams.get('activo');
    const activo =
      activoParam === 'true' ? true : activoParam === 'false' ? false : undefined;

    const data = await CostoEnvioService.listar({
      activo,
      search: searchParams.get('search') ?? undefined,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireServerRole(COSTO_ENVIO_ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const validated = crearCostoEnvioSchema.parse(body);

    const data = await CostoEnvioService.crear({
      zona: validated.zona,
      costo: validated.costo,
      activo: validated.activo,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('Ya existe') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
