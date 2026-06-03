export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { CotizacionesService } from '@/lib/services/cotizaciones.service';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { auditoriaService } from '@/lib/services/auditoria.service';

const COTIZACIONES_APROBAR_ROLES: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
];

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireServerRole(COTIZACIONES_APROBAR_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body.items)
      ? body.items.map((i: { item_id?: number; id?: number; precio_unitario: number }) => ({
          item_id: Number(i.item_id ?? i.id),
          precio_unitario: Number(i.precio_unitario),
        }))
      : undefined;

    const result = await CotizacionesService.aprobar(id, items);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'ACTUALIZAR',
      tabla: 'cotizaciones',
      registro_id: BigInt(id),
      datos_despues: { estado: 'convertida', pedido_id: result.pedidoId },
    });

    return NextResponse.json({
      success: true,
      pedidoId: result.pedidoId ?? null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}