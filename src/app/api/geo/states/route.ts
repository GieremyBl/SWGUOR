export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listarEstadosPorPais } from '@/lib/helpers/geo-internacional.helper';

/** GET /api/geo/states?country=US */
export async function GET(req: Request) {
  try {
    const country = new URL(req.url).searchParams.get('country')?.trim().toUpperCase() ?? '';

    if (!country || country.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'country_invalido' },
        { status: 400 },
      );
    }

    const data = listarEstadosPorPais(country);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Geo] GET states:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
