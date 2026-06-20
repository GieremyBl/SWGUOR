export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { OrdenesProduccionItemsService } from '@/lib/services/ordenes-produccion-items.service';
import { requireServerRole } from '@/lib/auth/server';
import { ordenProduccionItemCreateSchema } from '@/lib/schemas/ordenes-produccion-items';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES_LECTURA: RolUsuario[] = [
  'administrador', 'gerente', 'representante_taller', 'recepcionista', 'disenador', 'almacenero',
];
const ROLES_ESCRITURA: RolUsuario[] = ['administrador', 'gerente', 'representante_taller'];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES_LECTURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const orden_produccion_id = searchParams.get('orden_produccion_id');
    if (!orden_produccion_id || !/^\d+$/.test(orden_produccion_id)) {
      return NextResponse.json(
        { error: 'orden_produccion_id numérico requerido' },
        { status: 400 },
      );
    }

    const data = await OrdenesProduccionItemsService.obtenerPorOrden(orden_produccion_id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrada') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = ordenProduccionItemCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { orden_produccion_id, ...item } = parsed.data;
    const data = await OrdenesProduccionItemsService.agregarItem(
      String(orden_produccion_id),
      item,
    );
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrad') || msg.includes('Ya existe') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'id numérico requerido' }, { status: 400 });
    }

    await OrdenesProduccionItemsService.eliminarItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrado') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
