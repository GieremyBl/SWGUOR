export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { REPORTE_CONVERSION_ROLES } from '@/lib/constants/conversion-comercial';
import { getReporteConversionComercial } from '@/lib/services/reporte-conversion-comercial.service';

/** GET /api/admin/reportes/conversion-comercial */
export async function GET() {
  const auth = await requireServerRole([...REPORTE_CONVERSION_ROLES]);
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const reporte = await getReporteConversionComercial();
    return NextResponse.json(reporte);
  } catch (error) {
    console.error('[GET /api/admin/reportes/conversion-comercial]', error);
    return NextResponse.json(
      { success: false, error: 'Error generando reporte de conversión comercial' },
      { status: 500 },
    );
  }
}
