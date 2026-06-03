export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { NextResponse } from 'next/server';
import { notificarTransicionEstadoPedido } from '@/lib/helpers/crear-notificacion.helper';

const ESTADOS_VALIDOS = ['pendiente', 'en_ruta', 'entregado', 'preparando', 'incidencia'] as const;

// GET: Listado de despachos con filtros
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const estado    = searchParams.get('estado');
    const pedidoId  = searchParams.get('pedido_id');
    const usuarioId = searchParams.get('usuario_id');

    const where: Record<string, unknown> = {};
    if (estado    && estado    !== 'todos') where.estado     = estado;
    if (pedidoId)                           where.pedido_id  = BigInt(pedidoId);
    if (usuarioId)                          where.usuario_id = BigInt(usuarioId);

    const despachos = await prisma.despachos.findMany({
      where,
      include: {
        pedidos: {
          include: {
            clientes: { select: { id: true, razon_social: true } },
          },
        },
      },
      orderBy: { fecha_despacho: 'desc' },
    });

    const data = despachos.map((d) => ({
      ...serializeBigInt(d),
      despacho_id: `DSP-${String(d.id).padStart(6, '0')}`,
      cliente: d.pedidos?.clientes?.razon_social ?? 'N/A',
      direccion: d.direccion_entrega,
    }));

    return NextResponse.json({ data, count: data.length });
  } catch (error: any) {
    console.error('Error fetching despachos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear despacho vinculado a un pedido
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.pedido_id || !body.usuario_id || !body.direccion_entrega) {
      return NextResponse.json(
        { error: 'pedido_id, usuario_id y direccion_entrega son obligatorios' },
        { status: 400 }
      );
    }

    const pedidoId  = BigInt(body.pedido_id);
    const usuarioId = BigInt(body.usuario_id);

    const pedido = await prisma.pedidos.findUnique({
      where: { id: pedidoId },
      include: { clientes: { select: { id: true, razon_social: true } } },
    });

    if (!pedido) {
      return NextResponse.json({ error: `El pedido #${pedidoId} no existe` }, { status: 404 });
    }

    const despachoExistente = await prisma.despachos.findFirst({
      where: { pedido_id: pedidoId, estado: { in: ['pendiente', 'preparando', 'en_ruta'] } },
    });

    if (despachoExistente) {
      return NextResponse.json(
        { error: 'Ya existe un despacho activo para este pedido' },
        { status: 409 }
      );
    }

    const despacho = await prisma.despachos.create({
      data: {
        pedido_id:         pedidoId,
        direccion_entrega: body.direccion_entrega.trim(),
        fecha_despacho:    body.fecha_despacho ? new Date(body.fecha_despacho) : new Date(),
        estado:            body.estado ?? 'preparando',
      },
      include: {
        pedidos: { include: { clientes: { select: { razon_social: true } } } },
      },
    });

    return NextResponse.json(serializeBigInt({
      ...despacho,
      despacho_id: `DSP-${String(despacho.id).padStart(6, '0')}`,
    }), { status: 201 });
  } catch (error: any) {
    console.error('Error creating despacho:', error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Pedido o usuario no encontrado' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Actualizar estado de entrega
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, estado, fecha_entrega } = body;

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    if (estado) {
      const normalizedEstado = estado.toLowerCase().trim();
      if (!ESTADOS_VALIDOS.includes(normalizedEstado as any)) {
        return NextResponse.json(
          { error: `Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const estadoNormalizado = estado ? estado.toLowerCase().trim() : null;

    const resultado = await prisma.$transaction(async (tx) => {
      const existing = await tx.despachos.findUnique({
        where: { id: BigInt(id) },
        include: {
          pedidos: {
            select: { id: true, estado: true, cliente_id: true },
          },
        },
      });

      if (!existing) throw new Error('Despacho no encontrado');

      const data: Record<string, unknown> = {};
      if (estadoNormalizado) data.estado = estadoNormalizado;
      if (data.estado === 'entregado') {
        data.fecha_entrega = fecha_entrega ? new Date(fecha_entrega) : new Date();
      }

      const updated = await tx.despachos.update({
        where: { id: BigInt(id) },
        data,
        include: {
          pedidos: { include: { clientes: { select: { razon_social: true } } } },
        },
      });

      const estadoAnteriorPedido = existing.pedidos?.estado ?? null;

      if (data.estado === 'entregado' && existing.pedidos) {
        await tx.pedidos.update({
          where: { id: existing.pedido_id },
          data: { estado: 'entregado' },
        });
      }

      return {
        updated,
        pedidoId: existing.pedido_id,
        clienteId: existing.pedidos?.cliente_id ?? null,
        estadoAnteriorPedido,
      };
    });

    if (
      estadoNormalizado === 'entregado' &&
      resultado.clienteId
    ) {
      await notificarTransicionEstadoPedido({
        clienteId: resultado.clienteId,
        pedidoId: resultado.pedidoId,
        estadoAnterior: resultado.estadoAnteriorPedido ?? 'listo_para_despacho',
        estadoNuevo: 'entregado',
      });
    }

    const despacho = resultado.updated;

    return NextResponse.json(serializeBigInt({
      ...despacho,
      despacho_id: `DSP-${String(despacho.id).padStart(6, '0')}`,
    }));
  } catch (error: any) {
    console.error('Error updating despacho:', error);
    if (error.code === 'P2025' || error.message === 'Despacho no encontrado') {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar un despacho
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await prisma.despachos.delete({ where: { id: BigInt(id) } });

    return NextResponse.json({ message: 'Despacho eliminado correctamente' });
  } catch (error: any) {
    console.error('Error deleting despacho:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}