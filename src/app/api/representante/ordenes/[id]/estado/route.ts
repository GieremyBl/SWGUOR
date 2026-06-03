export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type { EstadoConfeccion } from '@prisma/client';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { avanzarEstadoConfeccion } from '@/lib/helpers/representante-orden.helper';

const ROLES: RolUsuario[] = ['representante_taller', 'administrador', 'gerente'];

const ESTADOS_VALIDOS: EstadoConfeccion[] = ['en_proceso', 'completada'];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const estado = body.estado as EstadoConfeccion;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado no válido. Use en_proceso o completada.' },
        { status: 400 },
      );
    }

    await avanzarEstadoConfeccion({
      ordenId: BigInt(id),
      nuevoEstado: estado,
      usuarioId: BigInt(auth.user.id),
      notas: typeof body.notas === 'string' ? body.notas : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[PATCH representante estado]', error);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
