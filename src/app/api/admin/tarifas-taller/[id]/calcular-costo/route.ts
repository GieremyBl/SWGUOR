export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { TarifasTallerService } from '@/lib/services/tarifa-talleres.service';
import { requireServerRole } from '@/lib/auth/server';
import { calcularCostoTarifaSchema } from '@/lib/schemas/tarifa-talleres';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'representante_taller', 'almacenero'];

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = calcularCostoTarifaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const result = await TarifasTallerService.calcularCosto(id, parsed.data.cantidad);
    return NextResponse.json({
      success: true,
      data: {
        costo: result.costo,
        precio_unitario: result.precio_unitario,
        cantidad: result.cantidad,
        moneda: result.moneda,
        tarifa: result.tarifa,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('no encontrada') || msg.includes('no está activa') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
