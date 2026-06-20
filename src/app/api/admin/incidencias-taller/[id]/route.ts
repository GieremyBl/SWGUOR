export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  INCIDENCIAS_TALLER_ROLES_CREAR,
  INCIDENCIAS_TALLER_ROLES_GESTION,
  INCIDENCIAS_TALLER_ROLES_VER,
} from '@/lib/constants/incidencias-taller';
import {
  asignarIncidenciaTallerSchema,
  editarIncidenciaTallerSchema,
  resolverIncidenciaTallerSchema,
} from '@/lib/schemas/incidencias-taller';
import { IncidenciasTallerService } from '@/lib/services/incidencias-taller.service';
import { ZodError } from 'zod';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(INCIDENCIAS_TALLER_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const data = await IncidenciasTallerService.obtenerPorId(id);
    if (!data) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();

    if (body.solucion !== undefined) {
      const auth = await requireServerRole(INCIDENCIAS_TALLER_ROLES_GESTION);
      if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const validated = resolverIncidenciaTallerSchema.parse(body);
      const data = await IncidenciasTallerService.resolver(id, {
        solucion: validated.solucion,
        impacto_horas: validated.impacto_horas,
        resuelto_por: String(auth.user.id),
      });
      return NextResponse.json({ success: true, data });
    }

    if (body.asignado_a !== undefined && !body.tipo && !body.severidad && !body.descripcion) {
      const auth = await requireServerRole(INCIDENCIAS_TALLER_ROLES_GESTION);
      if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const validated = asignarIncidenciaTallerSchema.parse(body);
      const data = await IncidenciasTallerService.asignar(id, validated.asignado_a);
      return NextResponse.json({ success: true, data });
    }

    const auth = await requireServerRole([
      ...INCIDENCIAS_TALLER_ROLES_GESTION,
      ...INCIDENCIAS_TALLER_ROLES_CREAR,
    ]);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const validated = editarIncidenciaTallerSchema.parse(body);
    const data = await IncidenciasTallerService.actualizar(id, {
      ...validated,
      foto_url: validated.foto_url === '' ? null : validated.foto_url,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : 'Error interno';
    const status =
      message.includes('no encontrada') || message.includes('No se puede') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
