export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { obtenerClientePortalSesion } from '@/lib/helpers/portal-cliente.helper';
import { crearIncidenciaClienteSchema } from '@/lib/schemas/incidencias-cliente';
import {
  IncidenciasClienteService,
  isIncidenciaClienteError,
} from '@/lib/services/incidencias-cliente.service';
import { ZodError } from 'zod';

export async function GET() {
  const sesion = await obtenerClientePortalSesion();
  if ('error' in sesion) {
    return NextResponse.json({ error: sesion.error }, { status: sesion.status });
  }

  try {
    const data = await IncidenciasClienteService.listar({
      cliente_id: sesion.cliente_id,
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerClientePortalSesion();
  if ('error' in sesion) {
    return NextResponse.json({ error: sesion.error }, { status: sesion.status });
  }

  try {
    const body = await req.json();
    const validated = crearIncidenciaClienteSchema.parse(body);
    const data = await IncidenciasClienteService.crearParaCliente(
      sesion.cliente_id,
      validated,
    );
    return NextResponse.json({ success: true, data }, { status: 201 });
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
