export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { ordenesCompraService } from '@/lib/services/ordenes-compra.service';
import { getOrdenCompraPdfPublicUrl } from '@/lib/services/orden-compra-documento.service';
import { serializeBigInt } from '@/lib/utils/serialize';
import { actualizarOrdenCompraSchema } from '@/lib/schemas/ordenes-compra';

const ORDENES_COMPRA_ROLES: RolUsuario[] = [
  'administrador',
  'gerente',
  'almacenero',
];

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const auth = await requireServerRole(ORDENES_COMPRA_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const ordenId = BigInt(id);

    const orden = await ordenesCompraService.obtenerPorId(ordenId);
    if (!orden) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        ...orden,
        pdf_url: getOrdenCompraPdfPublicUrl(id),
      }),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[GET ordenes-compra/:id]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const auth = await requireServerRole(ORDENES_COMPRA_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = actualizarOrdenCompraSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const orden = await ordenesCompraService.actualizar(BigInt(id), parsed.data);
    return NextResponse.json({ success: true, data: serializeBigInt(orden) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[PATCH ordenes-compra/:id]', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
