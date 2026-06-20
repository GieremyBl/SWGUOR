export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { FichasTecnicasDetalleService } from '@/lib/services/fichas-tecnicas-detalle.service';
import { requireServerRole } from '@/lib/auth/server';
import {
  fichaDetalleBulkSchema,
  fichaDetalleSingleSchema,
} from '@/lib/schemas/fichas-tecnicas-detalle';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES: RolUsuario[] = ['disenador', 'cortador', 'administrador', 'gerente'];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const ficha_id = searchParams.get('ficha_id');
    if (!ficha_id || !/^\d+$/.test(ficha_id)) {
      return NextResponse.json({ error: 'ficha_id numérico requerido' }, { status: 400 });
    }

    const data = await FichasTecnicasDetalleService.obtenerPorFicha(ficha_id);
    const costo_calculado = await FichasTecnicasDetalleService.calcularCosto(ficha_id);

    return NextResponse.json({ success: true, data, costo_calculado });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
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

    if (body.item && !body.items) {
      const parsed = fichaDetalleSingleSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
          { status: 400 },
        );
      }
      const data = await FichasTecnicasDetalleService.agregarItem(
        String(parsed.data.ficha_id),
        parsed.data.item,
      );
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const parsed = fichaDetalleBulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'ficha_id y items[] requeridos' },
        { status: 400 },
      );
    }

    const data = await FichasTecnicasDetalleService.guardar(
      String(parsed.data.ficha_id),
      parsed.data.items,
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrada') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'id numérico requerido' }, { status: 400 });
    }

    await FichasTecnicasDetalleService.eliminarItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrado') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
