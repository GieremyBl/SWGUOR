export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { notificarTransicionEstadoPedido } from '@/lib/helpers/crear-notificacion.helper';
import { puedeTransicionar } from '@/lib/helpers/pedido-transiciones.helper';

const SEGUIMIENTO_PEDIDO_LECTURA: RolUsuario[] = [
  'administrador',
  'gerente',
  'recepcionista',
];
const SEGUIMIENTO_PEDIDO_ESCRITURA: RolUsuario[] = ['administrador', 'gerente'];

// ── GET: Seguimientos por pedido ──────────────────────────────────────────
export async function GET(req: Request) {
  const auth = await requireServerRole(SEGUIMIENTO_PEDIDO_LECTURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const pedido_id = searchParams.get('pedido_id');

    if (!pedido_id) {
      return NextResponse.json({ error: 'pedido_id requerido' }, { status: 400 });
    }

    const seguimientos = await prisma.seguimiento_pedido.findMany({
      where: { pedido_id: BigInt(pedido_id) },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ success: true, data: serializeBigInt(seguimientos) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST: Cambiar estado de pedido ────────────────────────────────────────
export async function POST(req: Request) {
  const auth = await requireServerRole(SEGUIMIENTO_PEDIDO_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { pedido_id, status, notas } = body;

    if (!pedido_id || !status) {
      return NextResponse.json({ error: 'pedido_id y status requeridos' }, { status: 400 });
    }

    const pedidoAntes = await prisma.pedidos.findUnique({
      where: { id: BigInt(pedido_id) },
      select: { estado: true, cliente_id: true },
    });

    if (!pedidoAntes?.cliente_id) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (!puedeTransicionar(pedidoAntes.estado, status)) {
      return NextResponse.json(
        {
          error: `Transición no permitida: ${pedidoAntes.estado} → ${status}`,
        },
        { status: 422 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const seg = await tx.seguimiento_pedido.create({
        data: {
          pedido_id:  BigInt(pedido_id),
          status,
          notas:      notas ?? null,
          creado_por: auth.user.authId,
        },
      });

      const pedidoActualizado = await tx.pedidos.update({
        where: { id: BigInt(pedido_id) },
        data:  { estado: status, updated_at: new Date() },
        select: { id: true, cliente_id: true, estado: true },
      });

      return { seg, pedidoActualizado };
    });

    await notificarTransicionEstadoPedido({
      clienteId: pedidoAntes.cliente_id,
      pedidoId: result.pedidoActualizado.id,
      estadoAnterior: pedidoAntes.estado,
      estadoNuevo: status,
    });

    return NextResponse.json(
      { success: true, data: serializeBigInt(result.seg) },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}