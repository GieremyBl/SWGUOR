export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { tesoreriaPagosQuerySchema } from '@/lib/schemas/tesoreria-pagos';
import { listarPagosTesoreria } from '@/lib/services/tesoreria-pagos.service';

const TESORERIA_ROLES: RolUsuario[] = ['administrador', 'gerente', 'recepcionista'];

/** GET /api/admin/tesoreria/pagos — listado paginado con filtros */
export async function GET(req: NextRequest) {
  const auth = await requireServerRole(TESORERIA_ROLES);
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsed = tesoreriaPagosQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      busqueda: searchParams.get('busqueda') ?? undefined,
      estado: searchParams.get('estado') ?? undefined,
      metodo_pago: searchParams.get('metodo_pago') ?? undefined,
      fecha_desde: searchParams.get('fecha_desde') ?? undefined,
      fecha_hasta: searchParams.get('fecha_hasta') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? 'Parámetros inválidos',
        },
        { status: 400 },
      );
    }

    const result = await listarPagosTesoreria(parsed.data);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      stats: result.stats,
    });
  } catch (error) {
    console.error('[GET /api/admin/tesoreria/pagos]', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
