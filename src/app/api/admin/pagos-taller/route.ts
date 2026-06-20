export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import {
  PAGOS_TALLER_ROLES_ESCRITURA,
  PAGOS_TALLER_ROLES_VER,
} from '@/lib/constants/pagos-taller';
import { crearPagoTallerInputSchema } from '@/lib/schemas/pagos-talleres';
import { PagosTallerService } from '@/lib/services/pagos-talleres.service';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  const auth = await requireServerRole(PAGOS_TALLER_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const result = await PagosTallerService.listar({
      taller_id: searchParams.get('taller_id') ?? undefined,
      confeccion_id: searchParams.get('confeccion_id') ?? undefined,
      orden_produccion_id: searchParams.get('orden_produccion_id') ?? undefined,
      estado: searchParams.get('estado') ?? undefined,
      metodo_pago: searchParams.get('metodo_pago') ?? undefined,
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
  const auth = await requireServerRole(PAGOS_TALLER_ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const validated = crearPagoTallerInputSchema.parse(body);

    const data = await PagosTallerService.crear(
      {
        taller_id: validated.taller_id,
        confeccion_id: validated.confeccion_id,
        orden_produccion_id: validated.orden_produccion_id,
        monto: validated.monto,
        moneda: validated.moneda,
        metodo_pago: validated.metodo_pago,
        fecha_pago: validated.fecha_pago,
        numero_operacion: validated.numero_operacion ?? undefined,
        comprobante_url: validated.comprobante_url || undefined,
        notas: validated.notas ?? undefined,
      },
      String(auth.user.id),
    );

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
