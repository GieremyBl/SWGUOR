export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  DEVOLUCIONES_PROVEEDOR_ROLES_EDITAR,
  DEVOLUCIONES_PROVEEDOR_ROLES_VER,
} from '@/lib/constants/devoluciones-proveedor';
import { actualizarEstadoDevolucionProveedorSchema } from '@/lib/schemas/devoluciones-proveedor';
import {
  DevolucionesProveedorService,
  isDevolucionProveedorError,
} from '@/lib/services/devoluciones-proveedor.service';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { AccionAuditoria } from '@prisma/client';
import { ZodError } from 'zod';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(DEVOLUCIONES_PROVEEDOR_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const data = await DevolucionesProveedorService.obtenerPorId(id);
    if (!data) {
      return NextResponse.json({ error: 'Devolución no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireServerRole(DEVOLUCIONES_PROVEEDOR_ROLES_EDITAR);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = actualizarEstadoDevolucionProveedorSchema.parse(body);
    const data = await DevolucionesProveedorService.actualizarEstado(
      id,
      validated,
      auth.user.id,
    );

    if (/^\d+$/.test(String(id))) {
      await auditoriaService.registrar({
        usuario_id: BigInt(auth.user.id),
        accion: AccionAuditoria.actualizar,
        tabla: 'devoluciones_proveedor',
        registro_id: BigInt(id),
        datos_despues: { ...validated },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    if (isDevolucionProveedorError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
