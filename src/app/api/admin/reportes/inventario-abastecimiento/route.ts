export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { REPORTE_INVENTARIO_ROLES } from '@/lib/constants/reporte-inventario';
import { reporteInventarioQuerySchema } from '@/lib/schemas/reporte-inventario-abastecimiento';
import { getReporteInventarioAbastecimiento } from '@/lib/services/reporte-inventario-abastecimiento.service';

/** GET /api/admin/reportes/inventario-abastecimiento */
export async function GET(req: NextRequest) {
  const auth = await requireServerRole([...REPORTE_INVENTARIO_ROLES]);
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsed = reporteInventarioQuerySchema.safeParse({
      categoria_id: searchParams.get('categoria_id') ?? undefined,
      almacen_id: searchParams.get('almacen_id') ?? undefined,
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

    const reporte = await getReporteInventarioAbastecimiento(parsed.data);
    return NextResponse.json(reporte);
  } catch (error) {
    console.error('[GET /api/admin/reportes/inventario-abastecimiento]', error);
    return NextResponse.json(
      { success: false, error: 'Error generando reporte de inventario' },
      { status: 500 },
    );
  }
}
