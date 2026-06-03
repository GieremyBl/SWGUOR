export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import {
  listarDepartamentosPeru,
  listarDistritosPeru,
  listarProvinciasPeru,
} from '@/lib/helpers/peru-ubigeo.helper';

const TIPOS_VALIDOS = ['departamentos', 'provincias', 'distritos'] as const;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo') ?? 'departamentos';
    const codigo = searchParams.get('codigo') ?? '';

    if (!TIPOS_VALIDOS.includes(tipo as (typeof TIPOS_VALIDOS)[number])) {
      return NextResponse.json({ error: 'tipo_invalido' }, { status: 400 });
    }

    if (tipo === 'departamentos') {
      return NextResponse.json({ success: true, data: listarDepartamentosPeru() });
    }

    if (!codigo) {
      return NextResponse.json({ error: 'codigo_requerido' }, { status: 400 });
    }

    if (tipo === 'provincias') {
      return NextResponse.json({
        success: true,
        data: listarProvinciasPeru(codigo),
      });
    }

    return NextResponse.json({
      success: true,
      data: listarDistritosPeru(codigo),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[GET /api/ubigeo]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
