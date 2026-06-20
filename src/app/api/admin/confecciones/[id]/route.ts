export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { ConfeccionesService } from '@/lib/services/confecciones.service';
import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  CONFECCIONES_ROLES_ESCRITURA,
  CONFECCIONES_ROLES_VER,
} from '@/lib/constants/confecciones';
import {
  actualizarConfeccionInputSchema,
  cambiarEstadoConfeccionSchema,
} from '@/lib/schemas/confecciones';
import { ZodError } from 'zod';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_VER);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const data = await ConfeccionesService.obtenerPorId(id);
    if (!data) {
      return NextResponse.json({ error: 'Confección no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_ESCRITURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const validated = actualizarConfeccionInputSchema.parse(body);

    const data = await ConfeccionesService.actualizarDatos(
      id,
      {
        ...validated,
        orden_produccion_id: validated.orden_produccion_id ?? undefined,
      },
      auth.user.id?.toString(),
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('no encontrada') || message.includes('No se puede') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_ESCRITURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const validated = cambiarEstadoConfeccionSchema.parse(body);

    const data = await ConfeccionesService.actualizarEstado(id, {
      estado: validated.estado,
      notas: validated.notas ?? undefined,
      responsable_id: auth.user.id?.toString(),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_ESCRITURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const notas = typeof body?.notas === 'string' ? body.notas : 'Cancelación administrativa';

    const data = await ConfeccionesService.cancelar(
      id,
      { estado: 'cancelada', notas },
      auth.user.id?.toString(),
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('no encontrada') || message.includes('cerrada') ? 400 : 500;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
