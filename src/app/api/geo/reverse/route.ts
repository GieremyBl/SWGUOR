export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json({ success: false, error: 'Faltan coordenadas' }, { status: 400 });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SWGUOR/1.0 (location-reverse-proxy)',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'No se pudo resolver la dirección' },
        { status: 502 }
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('[Geo] Error en reverse geocode:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al resolver la dirección' },
      { status: 500 }
    );
  }
}