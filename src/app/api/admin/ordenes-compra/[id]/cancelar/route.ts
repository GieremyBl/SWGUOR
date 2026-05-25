export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { ordenesCompraService } from '@/lib/services/ordenes-compra.service';
import { serializeBigInt } from '@/lib/utils/serialize';

const ORDENES_COMPRA_ROLES: RolUsuario[] = [
  'administrador',
  'gerente',
  'almacenero',
];

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const auth = await requireServerRole(ORDENES_COMPRA_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const orden = await ordenesCompraService.cancelar(BigInt(id));
    return NextResponse.json({ success: true, data: serializeBigInt(orden) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
