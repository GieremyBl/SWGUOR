export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { ConfeccionesService } from '@/lib/services/confecciones.service';
import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  CONFECCIONES_ROLES_ESCRITURA,
  CONFECCIONES_ROLES_VER,
} from '@/lib/constants/confecciones';
import {
  actualizarConfeccionInputSchema,
  avanzarEtapaConfeccionSchema,
} from '@/lib/schemas/confecciones';
import { ZodError } from 'zod';
import type { EtapaConfeccion } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

// ==========================================
// GET: Detalle de confección
// ==========================================
export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_VER);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const data = await ConfeccionesService.obtenerPorId(id);
    if (!data) return NextResponse.json({ error: 'Confección no encontrada' }, { status: 404 });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ==========================================
// PUT: Campos estructurales del lote
// (prenda, cantidad, taller, prioridad, etc.)
// NO toca etapa ni estado — eso es territorio del trigger.
// ==========================================
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_ESCRITURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await req.json();
    const validated = actualizarConfeccionInputSchema.parse(body);

    const data = await ConfeccionesService.actualizarDatosEstructurales(id, {
      ...validated,
      orden_produccion_id: validated.orden_produccion_id ?? undefined,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('no encontrada') || message.includes('No se puede') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// ==========================================
// PATCH: Avanzar etapa de producción
//
// Inserta en seguimiento_confeccion → el trigger fn_sync_confeccion_etapa
// deriva el nuevo `estado` automáticamente. Este handler NUNCA fija `estado`
// de forma directa (solo lo hace DELETE para cancelaciones).
//
// Body: { etapa_nueva: EtapaConfeccion; notas?: string | null }
// ==========================================
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_ESCRITURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await req.json();
    const validated = avanzarEtapaConfeccionSchema.parse(body);

    const data = await ConfeccionesService.avanzarEtapa(
      id,
      {
        etapa_nueva: validated.etapa_nueva as EtapaConfeccion,
        notas: validated.notas ?? null,
      },
      auth.user.id?.toString(),
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('no encontrada') || message.includes('cerrada') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// ==========================================
// DELETE: Cancelación / rechazo administrativo
//
// Único punto donde `estado` se fuerza manualmente (override del flujo de triggers).
// Body: { notas?: string; estado?: 'cancelada' | 'rechazada' }
// Si no se pasa `estado`, se asume 'cancelada'.
// ==========================================
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_ESCRITURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const notas: string = typeof body?.notas === 'string' ? body.notas : 'Cancelación administrativa';
    const estado: 'cancelada' | 'rechazada' =
      body?.estado === 'rechazada' ? 'rechazada' : 'cancelada';

    const data = await ConfeccionesService.cancelar(
      id,
      { estado, notas },
      auth.user.id?.toString(),
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('no encontrada') || message.includes('cerrada') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}