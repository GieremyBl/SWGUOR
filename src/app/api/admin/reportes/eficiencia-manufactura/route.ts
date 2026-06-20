export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { REPORTE_MANUFACTURA_ROLES } from '@/lib/constants/eficiencia-manufactura';
import { getReporteManufacturaEficiencia } from '@/lib/services/reporte-eficiencia-manufactura.service';

/** GET /api/admin/reportes/eficiencia-manufactura */
export async function GET() {
  const auth = await requireServerRole([...REPORTE_MANUFACTURA_ROLES]);
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const reporte = await getReporteManufacturaEficiencia();
    return NextResponse.json(reporte);
  } catch (error) {
    console.error('[GET /api/admin/reportes/eficiencia-manufactura]', error);
    return NextResponse.json(
      { success: false, error: 'Error generando reporte de manufactura' },
      { status: 500 },
    );
  }
}
