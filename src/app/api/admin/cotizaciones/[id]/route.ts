export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { CotizacionesService } from '@/lib/services/cotizaciones.service';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const data = await CotizacionesService.obtenerDetalleAdmin(id);
    if (!data) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}