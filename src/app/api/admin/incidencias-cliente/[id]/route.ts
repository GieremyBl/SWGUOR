export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  INCIDENCIAS_CLIENTE_ROLES_RESPONDER,
  INCIDENCIAS_CLIENTE_ROLES_VER,
} from '@/lib/constants/incidencias-cliente';
import { responderIncidenciaClienteSchema } from '@/lib/schemas/incidencias-cliente';
import {
  IncidenciasClienteService,
  isIncidenciaClienteError,
} from '@/lib/services/incidencias-cliente.service';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { AccionAuditoria } from '@prisma/client';
import { ZodError } from 'zod';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(INCIDENCIAS_CLIENTE_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const data = await IncidenciasClienteService.obtenerPorId(id);
    if (!data) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireServerRole(INCIDENCIAS_CLIENTE_ROLES_RESPONDER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validated = responderIncidenciaClienteSchema.parse(body);
    const data = await IncidenciasClienteService.responder(id, validated);

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: AccionAuditoria.actualizar,
      tabla: 'incidencias_cliente',
      registro_id: BigInt(id),
      datos_despues: data,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    if (isIncidenciaClienteError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
