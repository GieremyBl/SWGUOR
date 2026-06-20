export const runtime = 'nodejs';

import { MaterialesService } from '@/lib/services/material.service';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { ROLES_SISTEMA } from '@/lib/auth/auth.service';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { operacion, cantidad, motivo } = body;

    const auth = await requireServerRole([ROLES_SISTEMA.administrador, 'almacenero']);

    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!operacion || cantidad === undefined) {
      return NextResponse.json(
        { error: 'operacion y cantidad requeridos' },
        { status: 400 }
      );
    }

    const data = await MaterialesService.ajustarStock(id, {
      operacion,
      cantidad,
      motivo,
      usuario_id: auth.user.id,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}