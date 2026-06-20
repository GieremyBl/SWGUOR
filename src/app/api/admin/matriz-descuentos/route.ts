export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { obtenerMatrizDescuentos } from '@/lib/services/matriz-descuentos.service';

const ROLES: RolUsuario[] = ['administrador', 'gerente'];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get('busqueda') ?? undefined;
    const data = await obtenerMatrizDescuentos(busqueda);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
