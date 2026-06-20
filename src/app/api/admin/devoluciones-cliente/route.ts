export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  DEVOLUCIONES_CLIENTE_ROLES_CREAR,
  DEVOLUCIONES_CLIENTE_ROLES_VER,
} from '@/lib/constants/devoluciones-cliente';
import { crearDevolucionClienteSchema } from '@/lib/schemas/devoluciones-cliente';
import {
  DevolucionesClienteService,
  isDevolucionClienteError,
} from '@/lib/services/devoluciones-cliente.service';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { AccionAuditoria, EstadoDevolucion } from '@prisma/client';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  const auth = await requireServerRole(DEVOLUCIONES_CLIENTE_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const estadoRaw = searchParams.get('estado');
    const pedidoId = searchParams.get('pedido_id');
    const clienteId = searchParams.get('cliente_id');
    const busqueda = searchParams.get('busqueda') ?? undefined;

    const estado =
      estadoRaw && Object.values(EstadoDevolucion).includes(estadoRaw as EstadoDevolucion)
        ? (estadoRaw as EstadoDevolucion)
        : undefined;

    const data = await DevolucionesClienteService.listar({
      estado,
      pedido_id: pedidoId ? Number(pedidoId) : undefined,
      cliente_id: clienteId ? Number(clienteId) : undefined,
      busqueda,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireServerRole(DEVOLUCIONES_CLIENTE_ROLES_CREAR);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const validated = crearDevolucionClienteSchema.parse(body);
    const data = await DevolucionesClienteService.crear(validated);
    const devolucionId = typeof data.id === 'bigint' ? data.id : BigInt(String(data.id));

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: AccionAuditoria.crear,
      tabla: 'devoluciones_cliente',
      registro_id: devolucionId,
      datos_despues: data,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    if (isDevolucionClienteError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
