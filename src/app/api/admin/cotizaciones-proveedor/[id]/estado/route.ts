export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { cambiarEstadoCotizacionProveedorSchema } from '@/lib/schemas/cotizaciones-proveedor';
import { cotizacionesProveedorService } from '@/lib/services/cotizaciones-proveedor.service';
import { getCotizacionProveedorPdfPublicUrl } from '@/lib/services/cotizacion-proveedor-documento.service';
import { serializeBigInt } from '@/lib/utils/serialize';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero'];

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = cambiarEstadoCotizacionProveedorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Estado inválido' },
        { status: 400 },
      );
    }

    const cotizacion = await cotizacionesProveedorService.cambiarEstado(
      BigInt(id),
      parsed.data.estado,
    );

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        ...cotizacion,
        pdf_url: cotizacion.pdf_url ?? getCotizacionProveedorPdfPublicUrl(id),
      }),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
