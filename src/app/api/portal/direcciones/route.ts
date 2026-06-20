export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { obtenerClientePortalSesion } from '@/lib/helpers/portal-cliente.helper';
import { direccionClienteCreateSchema } from '@/lib/schemas/direcciones-cliente';
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

export async function GET() {
  const sesion = await obtenerClientePortalSesion();
  if ('error' in sesion) {
    return NextResponse.json({ success: false, error: sesion.error }, { status: sesion.status });
  }

  try {
    const data = await DireccionesClienteService.listarPorCliente(sesion.cliente_id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return mapServiceError(error);
  }
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerClientePortalSesion();
  if ('error' in sesion) {
    return NextResponse.json({ success: false, error: sesion.error }, { status: sesion.status });
  }

  try {
    const body = await req.json();
    const validated = direccionClienteCreateSchema.parse(body);
    const data = await DireccionesClienteService.crear(sesion.cliente_id, validated);
    return NextResponse.json({ success: true, data }, { status: 201 });
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
