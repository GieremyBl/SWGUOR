export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { PAGOS_TALLER_ROLES_ESCRITURA, PAGOS_TALLER_ROLES_VER } from '@/lib/constants/pagos-taller';
import {
  actualizarPagoTallerInputSchema,
  anularPagoTallerInputSchema,
  registrarPagoTallerInputSchema,
} from '@/lib/schemas/pagos-talleres';
import { PagosTallerService } from '@/lib/services/pagos-talleres.service';
import { ZodError } from 'zod';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(PAGOS_TALLER_ROLES_VER);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const data = await PagosTallerService.obtenerPorId(id);
    if (!data) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireServerRole(PAGOS_TALLER_ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();

    if (body.accion === 'anular') {
      const validated = anularPagoTallerInputSchema.parse(body);
      const data = await PagosTallerService.anular(id, validated.notas);
      return NextResponse.json({ success: true, data });
    }

    if (body.accion === 'registrar') {
      const validated = registrarPagoTallerInputSchema.parse(body);
      const data = await PagosTallerService.registrarPago(id, {
        monto: validated.monto,
        metodo_pago: validated.metodo_pago,
        fecha_pago: validated.fecha_pago,
        numero_operacion: validated.numero_operacion,
        comprobante_url: validated.comprobante_url || undefined,
        notas: validated.notas,
      });
      return NextResponse.json({ success: true, data });
    }

    const validated = actualizarPagoTallerInputSchema.parse(body);
    const data = await PagosTallerService.actualizar(id, {
      ...validated,
      comprobante_url: validated.comprobante_url === '' ? null : validated.comprobante_url,
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
      message.includes('no encontrado') || message.includes('No se puede') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
