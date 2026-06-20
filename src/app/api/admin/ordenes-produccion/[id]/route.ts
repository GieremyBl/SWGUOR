export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { OrdenesProduccionService } from '@/lib/services/ordenes-produccion.service';
import { requireServerRole } from '@/lib/auth/server';
import { z } from 'zod';
import { ESTADO_ORDEN_PRODUCCION } from '@/lib/schemas/ordenes-produccion';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES_LECTURA: RolUsuario[] = [
  'administrador', 'gerente', 'representante_taller', 'recepcionista', 'disenador', 'almacenero',
];
const ROLES_ESCRITURA: RolUsuario[] = ['administrador', 'gerente', 'representante_taller'];

const updateSchema = z.object({
  producto_id: z.coerce.number().optional(),
  taller_id: z.coerce.number().optional(),
  ficha_id: z.coerce.number().optional(),
  pedido_id: z.coerce.number().nullable().optional(),
  cantidad_solicitada: z.coerce.number().min(1).optional(),
  fecha_entrega: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  estado: z.enum(ESTADO_ORDEN_PRODUCCION).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_LECTURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const orden = await OrdenesProduccionService.obtenerPorId(id);
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: orden });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const orden = await OrdenesProduccionService.actualizar(id, parsed.data);
    return NextResponse.json({ success: true, data: orden });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrada') || (error as { code?: string })?.code === 'P2025'
      ? 404
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
