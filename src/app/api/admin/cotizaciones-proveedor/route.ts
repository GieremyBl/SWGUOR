export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { crearCotizacionProveedorSchema } from '@/lib/schemas/cotizaciones-proveedor';
import { cotizacionesProveedorService } from '@/lib/services/cotizaciones-proveedor.service';
import { getCotizacionProveedorPdfPublicUrl } from '@/lib/services/cotizacion-proveedor-documento.service';
import { serializeBigInt } from '@/lib/utils/serialize';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero'];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const result = await cotizacionesProveedorService.listar({
      estado: searchParams.get('estado') ?? undefined,
      proveedor_id: searchParams.get('proveedor_id')
        ? BigInt(searchParams.get('proveedor_id')!)
        : undefined,
      busqueda: searchParams.get('busqueda') ?? undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
    });

    const data = result.data.map((c) => ({
      ...serializeBigInt(c),
      pdf_url: c.pdf_url ?? getCotizacionProveedorPdfPublicUrl(String(c.id)),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = crearCotizacionProveedorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const cotizacion = await cotizacionesProveedorService.crear(
      parsed.data,
      auth.user.authId,
    );

    return NextResponse.json(
      {
        success: true,
        data: serializeBigInt({
          ...cotizacion,
          pdf_url: getCotizacionProveedorPdfPublicUrl(String(cotizacion.id)),
        }),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
