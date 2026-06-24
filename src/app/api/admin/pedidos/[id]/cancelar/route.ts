export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { requireServerRole } from '@/lib/auth/server';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { AccionAuditoria } from '@prisma/client';
import { NextResponse } from 'next/server';

const CANCEL_ROLES = ['administrador', 'gerente'] as const;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireServerRole([...CANCEL_ROLES]);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const pedidoId = BigInt(params.id);

  try {
    const { motivo } = await req.json();
    if (!motivo?.trim()) {
      return NextResponse.json({ error: 'Se requiere motivo de cancelación' }, { status: 400 });
    }

    const pedido = await prisma.$transaction(async (tx) => {
      const existing = await tx.pedidos.findUnique({
        where: { id: pedidoId },
        select: { estado: true },
      });

      if (!existing) throw new Error('Pedido no encontrado');
      if (existing.estado === 'cancelado') throw new Error('El pedido ya está cancelado');
      if (existing.estado === 'entregado' || existing.estado === 'pagado') {
        throw new Error(`No se puede cancelar un pedido en estado: ${existing.estado}`);
      }

      const updated = await tx.pedidos.update({
        where: { id: pedidoId },
        data: { estado: 'cancelado', updated_at: new Date() },
      });

      await tx.seguimiento_pedido.create({
        data: {
          pedido_id: pedidoId,
          status: 'cancelado',
          notas: `Cancelado por ${auth.user.email}: ${motivo}`,
          creado_por: auth.user.authId ?? null,
        },
      });

      return updated;
    });

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: AccionAuditoria.actualizar,
      tabla: 'pedidos',
      registro_id: pedidoId,
      datos_despues: { estado: 'cancelado', motivo },
    });

    return NextResponse.json({ success: true, data: pedido });
  } catch (error: any) {
    console.error('[POST /pedidos/:id/cancelar]', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}