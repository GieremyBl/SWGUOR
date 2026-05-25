export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { obtenerCatalogoPromocionesPortal } from '@/lib/services/portal-promociones-catalogo.service';

/**
 * GET /api/portal/promociones-catalogo
 * Campañas vigentes y productos asociados para el catálogo B2B.
 */
export async function GET() {
  try {
    const data = await obtenerCatalogoPromocionesPortal();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Portal] promociones-catalogo:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
