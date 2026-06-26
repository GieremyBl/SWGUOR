export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { ROLES_EMPAQUE_PEDIDO } from '@/lib/constants/pedidos-logistica';
import { crearDespachoPedido } from '@/lib/helpers/crear-despacho-pedido.helper';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { AccionAuditoria } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_EMPAQUE_PEDIDO);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const direccion = typeof body.direccion_entrega === 'string'
      ? body.direccion_entrega.trim()
      : '';

    if (!direccion) {
      return NextResponse.json(
        { error: 'direccion_entrega es requerida' },
        { status: 400 }
      );
    }
    const fechaRaw = body.fecha_entrega_estimada;
    const fotos = Array.isArray(body.fotos)
      ? body.fotos.filter((u: unknown) => typeof u === 'string')
      : [];

    if (!fechaRaw) {
      return NextResponse.json(
        { error: 'fecha_entrega_estimada es requerida' },
        { status: 400 },
      );
    }

    const fechaEntrega = new Date(fechaRaw);
    if (Number.isNaN(fechaEntrega.getTime())) {
      return NextResponse.json({ error: 'Fecha de entrega inválida' }, { status: 400 });
    }

    const resultado = await crearDespachoPedido({
      pedidoId: BigInt(id),
      direccionEntrega: direccion,
      fechaEntregaEstimada: fechaEntrega,
      fotosEmpaque: fotos,
      notasEmpaque: typeof body.notas === 'string' ? body.notas : undefined,
      creadoPorAuthId: auth.user.authId,
    });

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: AccionAuditoria.crear,
      tabla: 'despachos',
      registro_id: resultado.despachoId,
      datos_despues: { grupo_id: resultado.grupoId, direccion },
    });

    return NextResponse.json({
      success: true,
      data: {
        despacho_id: String(resultado.despachoId),
        grupo_id: String(resultado.grupoId),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';

    if (error instanceof Error && (error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
