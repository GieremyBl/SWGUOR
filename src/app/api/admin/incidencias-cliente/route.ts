export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { INCIDENCIAS_CLIENTE_ROLES_VER } from '@/lib/constants/incidencias-cliente';
import { IncidenciasClienteService } from '@/lib/services/incidencias-cliente.service';

export async function GET(req: NextRequest) {
  const auth = await requireServerRole(INCIDENCIAS_CLIENTE_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') ?? undefined;
    const busqueda = searchParams.get('busqueda') ?? undefined;

    const data = await IncidenciasClienteService.listar({
      estado: estado && estado !== 'todos' ? estado : undefined,
      busqueda,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
