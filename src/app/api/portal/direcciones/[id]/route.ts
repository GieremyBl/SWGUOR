export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { obtenerClientePortalSesion } from '@/lib/helpers/portal-cliente.helper';
import { prisma } from '@/lib/prisma';
import { direccionClienteUpdateSchema } from '@/lib/schemas/direcciones-cliente';
import {
  DireccionClienteError,
  DireccionesClienteService,
} from '@/lib/services/direcciones-cliente.service';

function mapServiceError(error: unknown) {
  if (error instanceof DireccionClienteError) {
    const status =
      error.code === 'NOT_FOUND' ? 404
      : error.code === 'CLIENTE_NOT_FOUND' ? 404
      : 400;
    return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
  }
  return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
}

async function assertDireccionDelCliente(direccionId: string, clienteId: bigint) {
  const direccion = await prisma.direcciones_cliente.findFirst({
    where: { id: BigInt(direccionId), cliente_id: clienteId },
    select: { id: true },
  });

  if (!direccion) {
    throw new DireccionClienteError('Dirección no encontrada', 'NOT_FOUND');
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sesion = await obtenerClientePortalSesion();
  if ('error' in sesion) {
    return NextResponse.json({ success: false, error: sesion.error }, { status: sesion.status });
  }

  try {
    const { id } = await params;
    await assertDireccionDelCliente(id, sesion.cliente_id);

    const body = await req.json();
    const validated = direccionClienteUpdateSchema.parse(body);
    const data = await DireccionesClienteService.actualizar(id, validated);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    return mapServiceError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sesion = await obtenerClientePortalSesion();
  if ('error' in sesion) {
    return NextResponse.json({ success: false, error: sesion.error }, { status: sesion.status });
  }

  try {
    const { id } = await params;
    await assertDireccionDelCliente(id, sesion.cliente_id);
    const data = await DireccionesClienteService.eliminar(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return mapServiceError(error);
  }
}
