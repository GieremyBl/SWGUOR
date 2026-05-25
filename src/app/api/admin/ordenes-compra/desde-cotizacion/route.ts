export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { ordenesCompraService } from '@/lib/services/ordenes-compra.service';
import { getOrdenCompraPdfPublicUrl } from '@/lib/services/orden-compra-documento.service';
import { serializeBigInt } from '@/lib/utils/serialize';
import { crearOrdenDesdeCotizacionSchema } from '@/lib/schemas/ordenes-compra';

const ORDENES_COMPRA_ROLES: RolUsuario[] = [
  'administrador',
  'gerente',
  'almacenero',
];

export async function POST(req: Request) {
  const auth = await requireServerRole(ORDENES_COMPRA_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = crearOrdenDesdeCotizacionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const orden = await ordenesCompraService.crearDesdeCotizacion(
      parsed.data,
      auth.user.authId,
    );

    return NextResponse.json(
      {
        success: true,
        data: serializeBigInt({
          ...orden,
          pdf_url: getOrdenCompraPdfPublicUrl(String(orden.id)),
        }),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[POST ordenes-compra/desde-cotizacion]', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
