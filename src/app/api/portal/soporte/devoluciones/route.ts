export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { obtenerClientePortalSesion } from '@/lib/helpers/portal-cliente.helper';
import { crearDevolucionClientePortalSchema } from '@/lib/schemas/soporte-portal';
import {
  DevolucionesClienteService,
  isDevolucionClienteError,
} from '@/lib/services/devoluciones-cliente.service';

export async function GET() {
  const sesion = await obtenerClientePortalSesion();
  if ('error' in sesion) {
    return NextResponse.json({ success: false, error: sesion.error }, { status: sesion.status });
  }

  try {
    const data = await DevolucionesClienteService.listar({
      cliente_id: Number(sesion.cliente_id),
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerClientePortalSesion();
  if ('error' in sesion) {
    return NextResponse.json({ success: false, error: sesion.error }, { status: sesion.status });
  }

  try {
    const body = await req.json();
    const validated = crearDevolucionClientePortalSchema.parse(body);
    const data = await DevolucionesClienteService.crearParaCliente(
      sesion.cliente_id,
      validated,
    );
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    if (isDevolucionClienteError(error)) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
