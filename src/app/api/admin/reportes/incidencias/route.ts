import { NextResponse } from 'next/server';

import {
  getReporteIncidencias,
} from '@/lib/services/reporte-incidencias.service';

export async function GET(
  request: Request,
) {

  try {

    const { searchParams } =
      new URL(request.url);

    const severidad =
      searchParams.get('severidad') ||
      undefined;

    const tipo =
      searchParams.get('tipo') ||
      undefined;

    const reporte =
      await getReporteIncidencias({

        severidad,

        tipo,

      });

    return NextResponse.json(
      reporte,
    );

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error:
          'Error generando reporte de incidencias',
      },
      {
        status: 500,
      },
    );
  }
}