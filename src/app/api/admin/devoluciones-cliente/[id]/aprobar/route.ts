export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { DEVOLUCIONES_CLIENTE_ROLES_RESOLVER } from '@/lib/constants/devoluciones-cliente';
import { resolverDevolucionClienteSchema } from '@/lib/schemas/devoluciones-cliente';
import {
  DevolucionesClienteService,
  isDevolucionClienteError,
} from '@/lib/services/devoluciones-cliente.service';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { AccionAuditoria } from '@prisma/client';
import { ZodError } from 'zod';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireServerRole(DEVOLUCIONES_CLIENTE_ROLES_RESOLVER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = resolverDevolucionClienteSchema.parse(body);
    const data = await DevolucionesClienteService.aprobar(id, auth.user.id, validated);

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: AccionAuditoria.aprobar,
      tabla: 'devoluciones_cliente',
      registro_id: BigInt(id),
      datos_despues: { estado_solicitud: 'aprobada', ...validated },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    if (isDevolucionClienteError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
