export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { ConfeccionesService } from '@/lib/services/confecciones.service';
import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  CONFECCIONES_ROLES_ESCRITURA,
  CONFECCIONES_ROLES_VER,
} from '@/lib/constants/confecciones';
import { crearConfeccionInputSchema } from '@/lib/schemas/confecciones';
import { ZodError } from 'zod';

export async function GET(req: Request) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_VER);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);

    const data = await ConfeccionesService.listar({
      estado: searchParams.get('estado') ?? '',
      taller_id: searchParams.get('taller_id') ?? '',
      orden_produccion_id: searchParams.get('orden_produccion_id') ?? '',
      prioridad: searchParams.get('prioridad') ?? '',
      search: searchParams.get('search') ?? '',
      page: searchParams.has('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : 10,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[GET /api/admin/confecciones]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_ESCRITURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const validated = crearConfeccionInputSchema.parse(body);

    const data = await ConfeccionesService.crear({
      taller_id: validated.taller_id,
      prenda: validated.prenda,
      cantidad: validated.cantidad,
      prioridad: validated.prioridad,
      estado: validated.estado,
      orden_produccion_id: validated.orden_produccion_id ?? null,
      costo_unitario: validated.costo_unitario ?? null,
      fecha_entrega: validated.fecha_entrega ?? null,
      notas: validated.notas ?? null,
      responsable_id: auth.user.id?.toString(),
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
