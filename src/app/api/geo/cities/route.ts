export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import {
  listarCiudadesPorEstado,
  listarCiudadesPorPais,
  listarEstadosPorPais,
} from '@/lib/helpers/geo-internacional.helper';

/** GET /api/geo/cities?country=US&state=CA */
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const country = params.get('country')?.trim().toUpperCase() ?? '';
    const state = params.get('state')?.trim().toUpperCase() ?? '';

    if (!country || country.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'country_invalido' },
        { status: 400 },
      );
    }

    const estados = listarEstadosPorPais(country);
    const data =
      estados.length === 0
        ? listarCiudadesPorPais(country)
        : state
          ? listarCiudadesPorEstado(country, state)
          : [];

    return NextResponse.json({ success: true, data, tieneEstados: estados.length > 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Geo] GET cities:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
