export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { SeguimientoConfeccionService } from '@/lib/services/seguimiento-confeccion.service';
import { requireServerRole } from '@/lib/auth/server';
import { registrarSeguimientoConfeccionSchema } from '@/lib/schemas/seguimiento-confeccion';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES_LECTURA: RolUsuario[] = [
  'administrador', 'gerente', 'disenador', 'cortador', 'representante_taller', 'ayudante', 'recepcionista',
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
    const confeccion_id = searchParams.get('confeccion_id');

    if (!confeccion_id || !/^\d+$/.test(confeccion_id)) {
      return NextResponse.json({ error: 'confeccion_id numérico requerido' }, { status: 400 });
    }

    const data = await SeguimientoConfeccionService.obtenerPorConfeccion(confeccion_id);
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
    const parsed = registrarSeguimientoConfeccionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const seguimiento = await SeguimientoConfeccionService.registrarCambioEstado({
      confeccion_id: String(parsed.data.confeccion_id),
      estado_nuevo: parsed.data.estado_nuevo,
      estado_anterior: parsed.data.estado_anterior ?? null,
      notas: parsed.data.notas ?? null,
      responsable_id: String(auth.user.id),
    });

    return NextResponse.json({ success: true, data: seguimiento }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrada') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
