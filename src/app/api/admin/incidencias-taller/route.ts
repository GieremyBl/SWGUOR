export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  INCIDENCIAS_TALLER_ROLES_CREAR,
  INCIDENCIAS_TALLER_ROLES_VER,
} from '@/lib/constants/incidencias-taller';
import { crearIncidenciaTallerSchema } from '@/lib/schemas/incidencias-taller';
import { IncidenciasTallerService } from '@/lib/services/incidencias-taller.service';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  const auth = await requireServerRole(INCIDENCIAS_TALLER_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const resueltoParam = searchParams.get('resuelto');
    const resuelto =
      resueltoParam === 'true' ? true : resueltoParam === 'false' ? false : undefined;

    const result = await IncidenciasTallerService.listar({
      severidad: searchParams.get('severidad') ?? undefined,
      resuelto,
      confeccion_id: searchParams.get('confeccion_id') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.has('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : 20,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireServerRole(INCIDENCIAS_TALLER_ROLES_CREAR);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const validated = crearIncidenciaTallerSchema.parse(body);

    const data = await IncidenciasTallerService.crear({
      confeccion_id: validated.confeccion_id,
      tipo: validated.tipo,
      severidad: validated.severidad,
      descripcion: validated.descripcion,
      reportado_por: String(auth.user.id),
      asignado_a: validated.asignado_a,
      impacto_horas: validated.impacto_horas,
      foto_url: validated.foto_url || undefined,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('No se encontró') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
