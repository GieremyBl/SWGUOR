export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { DEVOLUCIONES_CLIENTE_ROLES_VER } from '@/lib/constants/devoluciones-cliente';
import { DevolucionesClienteService } from '@/lib/services/devoluciones-cliente.service';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(DEVOLUCIONES_CLIENTE_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const data = await DevolucionesClienteService.obtenerPorId(id);
    if (!data) {
      return NextResponse.json({ error: 'Devolución no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
