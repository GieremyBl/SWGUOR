export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { SeguimientoProduccionService } from '@/lib/services/seguimiento-produccion.service';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { registrarEtapaSchema } from '@/lib/schemas/seguimiento-produccion';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'representante_taller', 'disenador', 'cortador', 'ayudante'];

// POST /api/admin/ordenes-produccion/etapa
// CORREGIDO: el segundo parámetro no puede ser usuario_id: string.
// En App Router, los handlers reciben (req: Request, { params }) — nada más.
// usuario_id debe venir en el body o extraerse de la sesión/auth.
export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES);
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

    const seg = await SeguimientoProduccionService.registrarEtapa({
      orden_id: String(parsed.data.orden_id),
      etapa: parsed.data.etapa,
      observaciones: parsed.data.observaciones,
      usuario_id: String(auth.user.id),
    });

    return NextResponse.json({ success: true, data: seg }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST /ordenes-produccion/etapas]', error);
    const status = (error as { code?: string })?.code === 'P2025' ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}