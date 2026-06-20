export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { reporteAnaliticaFinancieraQuerySchema } from '@/lib/schemas/reporte-analitica-financiera';
import { getReporteAnaliticaFinanciera } from '@/lib/services/reporte-analitica-financiera.service';

const REPORTE_ROLES: RolUsuario[] = ['administrador', 'gerente'];

/** GET /api/admin/reportes/analitica-financiera */
export async function GET(req: NextRequest) {
  const auth = await requireServerRole(REPORTE_ROLES);
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsed = reporteAnaliticaFinancieraQuerySchema.safeParse({
      moneda: searchParams.get('moneda') ?? undefined,
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

    const reporte = await getReporteAnaliticaFinanciera(parsed.data);
    return NextResponse.json(reporte);
  } catch (error) {
    console.error('[GET /api/admin/reportes/analitica-financiera]', error);
    return NextResponse.json(
      { success: false, error: 'Error generando reporte de analítica financiera' },
      { status: 500 },
    );
  }
}
