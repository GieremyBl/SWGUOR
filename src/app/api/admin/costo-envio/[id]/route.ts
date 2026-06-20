export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  COSTO_ENVIO_ROLES_ESCRITURA,
  COSTO_ENVIO_ROLES_VER,
} from '@/lib/constants/costo-envio';
import { actualizarCostoEnvioSchema } from '@/lib/schemas/costo-envio';
import { CostoEnvioService } from '@/lib/services/costo-envio.service';
import { ZodError } from 'zod';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(COSTO_ENVIO_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const data = await CostoEnvioService.obtenerPorId(numId);
    if (!data) {
      return NextResponse.json({ error: 'Zona no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireServerRole(COSTO_ENVIO_ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const validated = actualizarCostoEnvioSchema.parse(body);
    const data = await CostoEnvioService.actualizar(numId, validated);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('no encontrada') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireServerRole(COSTO_ENVIO_ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const data = await CostoEnvioService.desactivar(numId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('no encontrada') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
