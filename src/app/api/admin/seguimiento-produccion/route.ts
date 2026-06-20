export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { SeguimientoProduccionService } from '@/lib/services/seguimiento-produccion.service';
import { requireServerRole } from '@/lib/auth/server';
import { registrarEtapaSchema } from '@/lib/schemas/seguimiento-produccion';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES_LECTURA: RolUsuario[] = [
  'administrador', 'gerente', 'disenador', 'cortador', 'representante_taller', 'ayudante', 'recepcionista', 'almacenero',
];
const ROLES_ESCRITURA: RolUsuario[] = [
  'administrador', 'gerente', 'disenador', 'cortador', 'representante_taller', 'ayudante',
];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES_LECTURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const orden_id = searchParams.get('orden_id');

    if (!orden_id || !/^\d+$/.test(orden_id)) {
      return NextResponse.json({ error: 'orden_id numérico requerido' }, { status: 400 });
    }

    const data = await SeguimientoProduccionService.obtenerPorOrden(orden_id);
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
    const parsed = registrarEtapaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const seguimiento = await SeguimientoProduccionService.registrarEtapa({
      orden_id: String(parsed.data.orden_id),
      etapa: parsed.data.etapa,
      observaciones: parsed.data.observaciones,
      usuario_id: String(auth.user.id),
    });

    return NextResponse.json({ success: true, data: seguimiento }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrada') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
