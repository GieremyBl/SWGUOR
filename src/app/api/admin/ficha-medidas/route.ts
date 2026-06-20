export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { FichaMedidasService } from '@/lib/services/ficha-medidas.service';
import { requireServerRole } from '@/lib/auth/server';
import {
  fichaMedidasBulkSchema,
  fichaMedidaSingleSchema,
} from '@/lib/schemas/ficha-medidas';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES: RolUsuario[] = ['disenador', 'cortador', 'administrador', 'gerente'];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const ficha_id = new URL(req.url).searchParams.get('ficha_id');
    if (!ficha_id || !/^\d+$/.test(ficha_id)) {
      return NextResponse.json({ error: 'ficha_id numérico requerido' }, { status: 400 });
    }

    const data = await FichaMedidasService.obtenerPorFicha(ficha_id);
    return NextResponse.json({ success: true, data });
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

    if (body.medida && !body.medidas) {
      const parsed = fichaMedidaSingleSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
          { status: 400 },
        );
      }
      const data = await FichaMedidasService.agregarMedida(
        String(parsed.data.ficha_id),
        parsed.data.medida,
      );
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const parsed = fichaMedidasBulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'ficha_id y medidas[] requeridos' },
        { status: 400 },
      );
    }

    const data = await FichaMedidasService.guardar(
      String(parsed.data.ficha_id),
      parsed.data.medidas,
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
    const id = new URL(req.url).searchParams.get('id');
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'id numérico requerido' }, { status: 400 });
    }

    await FichaMedidasService.eliminarMedida(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrada') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status: status });
  }
}
