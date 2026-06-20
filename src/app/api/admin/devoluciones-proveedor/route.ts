export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  DEVOLUCIONES_PROVEEDOR_ROLES_CREAR,
  DEVOLUCIONES_PROVEEDOR_ROLES_VER,
} from '@/lib/constants/devoluciones-proveedor';
import { crearDevolucionProveedorSchema } from '@/lib/schemas/devoluciones-proveedor';
import {
  DevolucionesProveedorService,
  isDevolucionProveedorError,
} from '@/lib/services/devoluciones-proveedor.service';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { AccionAuditoria, EstadoDevolucionProv } from '@prisma/client';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  const auth = await requireServerRole(DEVOLUCIONES_PROVEEDOR_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const estadoRaw = searchParams.get('estado');
    const proveedorId = searchParams.get('proveedor_id');
    const busqueda = searchParams.get('busqueda') ?? undefined;

    const estado =
      estadoRaw && Object.values(EstadoDevolucionProv).includes(estadoRaw as EstadoDevolucionProv)
        ? (estadoRaw as EstadoDevolucionProv)
        : undefined;

    const data = await DevolucionesProveedorService.listar({
      estado,
      proveedor_id: proveedorId ? Number(proveedorId) : undefined,
      busqueda,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireServerRole(DEVOLUCIONES_PROVEEDOR_ROLES_CREAR);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const validated = crearDevolucionProveedorSchema.parse(body);
    const data = await DevolucionesProveedorService.crear(validated, auth.user.id);

    const rawId = String((data as { id: string | number }).id);
    const registroId = rawId.startsWith('mov-') ? rawId.replace('mov-', '') : rawId;

    if (/^\d+$/.test(registroId)) {
      await auditoriaService.registrar({
        usuario_id: BigInt(auth.user.id),
        accion: AccionAuditoria.crear,
        tabla: 'devoluciones_proveedor',
        registro_id: BigInt(registroId),
        datos_despues: data,
      });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
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
