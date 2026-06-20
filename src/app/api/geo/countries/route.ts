export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listarPaisesMundo } from '@/lib/helpers/geo-internacional.helper';

/** GET /api/geo/countries */
export async function GET() {
  try {
    const data = listarPaisesMundo();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Geo] GET countries:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
