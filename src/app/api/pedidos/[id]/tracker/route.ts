export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServerAuth } from '@/lib/auth/server';
import { serializeBigInt } from '@/lib/utils/serialize';
import { verificarAccesoPedido } from '@/lib/helpers/pedido-acceso.helper';
import {
  calcularPasosTracker,
  formatearFechaEntrega,
} from '@/lib/helpers/pedido-tracker.helper';
import {
  puedeClienteEditarDireccionDespacho,
} from '@/lib/helpers/pedido-direccion.helper';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const pedidoId = BigInt(id);

    const acceso = await verificarAccesoPedido(pedidoId, auth.user);
    if (!acceso.ok) {
      return NextResponse.json(
        { error: acceso.status === 404 ? 'pedido_no_encontrado' : 'sin_permisos' },
        { status: acceso.status },
      );
    }

    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId },
      include: {
        seguimiento_pedido: { orderBy: { created_at: 'asc' } },
        despachos: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!pedido) {
      return NextResponse.json({ error: 'pedido_no_encontrado' }, { status: 404 });
    }

    const despacho = pedido.despachos[0] ?? null;
    const pasos = calcularPasosTracker(pedido.estado, despacho?.estado);
    const fechaEntregaTexto = formatearFechaEntrega(despacho?.fecha_entrega);

    const puedeEditarDireccion =
      acceso.esClienteDueño &&
      puedeClienteEditarDireccionDespacho(pedido.estado, despacho?.estado);

    const historial = pedido.seguimiento_pedido.map((s) => ({
      id: Number(s.id),
      pedido_id: Number(s.pedido_id),
      status: s.status,
      notas: s.notas,
      created_at: s.created_at?.toISOString() ?? null,
      creado_por: s.creado_por,
    }));

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        pedido_id: Number(pedido.id),
        codigo: `ORD-${String(pedido.id).padStart(4, '0')}`,
        estado: pedido.estado,
        direccion_despacho: pedido.direccion_despacho,
        puede_editar_direccion: puedeEditarDireccion,
        modo: acceso.modo,
        pasos,
        fecha_entrega: despacho?.fecha_entrega?.toISOString() ?? null,
        fecha_entrega_texto: fechaEntregaTexto,
        fecha_entrega_pendiente: !fechaEntregaTexto,
        despacho_estado: despacho?.estado ?? null,
        historial,
      }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[GET /api/pedidos/:id/tracker]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
