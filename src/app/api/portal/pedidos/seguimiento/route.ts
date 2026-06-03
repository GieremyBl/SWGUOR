export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServerAuth } from '@/lib/auth/server';
import { serializeBigInt } from '@/lib/utils/serialize';
import {
  calcularFechaEntregaEstimada,
  formatearEtaLegible,
} from '@/lib/helpers/pedido-seguimiento.helper';
import { puedeClienteEditarDireccionDespacho } from '@/lib/helpers/pedido-direccion.helper';
import type { EstadoPedido } from '@prisma/client';

async function obtenerClienteId() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { error: auth.error, status: auth.status } as const;
  }

  const cliente = await prisma.clientes.findFirst({
    where: { usuario_id: auth.user.id },
    select: { id: true, estado: true },
  });

  if (!cliente) {
    return { error: 'cliente_no_encontrado', status: 404 } as const;
  }

  if (cliente.estado !== 'activo') {
    return { error: 'cliente_inactivo', status: 403 } as const;
  }

  return { cliente_id: cliente.id } as const;
}

export async function GET(req: Request) {
  try {
    const sesion = await obtenerClienteId();
    if ('error' in sesion) {
      return NextResponse.json(
        { success: false, error: sesion.error },
        { status: sesion.status },
      );
    }

    const { searchParams } = new URL(req.url);
    const incluirFinalizados = searchParams.get('todos') === '1';

    const pedidos = await prisma.pedidos.findMany({
      where: {
        cliente_id: sesion.cliente_id,
        ...(incluirFinalizados
          ? {}
          : { estado: { notIn: ['entregado', 'cancelado'] } }),
      },
      include: {
        clientes: {
          select: {
            razon_social: true,
            nombre_comercial: true,
            email: true,
          },
        },
        seguimiento_pedido: {
          orderBy: { created_at: 'asc' },
        },
        despachos: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { estado: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    const data = pedidos.map((p) => {
      const historial = p.seguimiento_pedido.map((s) => ({
        id: Number(s.id),
        pedido_id: Number(s.pedido_id),
        status: s.status as EstadoPedido,
        notas: s.notas,
        created_at: s.created_at?.toISOString() ?? new Date().toISOString(),
        updated_at: s.updated_at?.toISOString() ?? new Date().toISOString(),
        creado_por: s.creado_por,
      }));

      const ultima =
        historial.at(-1)?.created_at ?? p.created_at?.toISOString() ?? null;
      const eta = calcularFechaEntregaEstimada(
        p.created_at ?? new Date(),
        p.estado,
      );

      return {
        id: Number(p.id),
        codigo: `ORD-${String(p.id).padStart(4, '0')}`,
        estado: p.estado ?? 'pendiente',
        cliente:
          p.clientes?.nombre_comercial ??
          p.clientes?.razon_social ??
          'Cliente',
        email: p.clientes?.email ?? null,
        created_at: p.created_at?.toISOString() ?? new Date().toISOString(),
        fecha_entrega_est: eta.toISOString(),
        fecha_entrega_est_texto: formatearEtaLegible(eta),
        total_unidades: p.total_unidades ?? 0,
        notas_cliente: p.notas_cliente,
        direccion_despacho: p.direccion_despacho,
        puede_editar_direccion: puedeClienteEditarDireccionDespacho(
          p.estado,
          p.despachos[0]?.estado,
        ),
        historial,
        ultimaActualizacion: ultima,
      };
    });

    return NextResponse.json({ success: true, data: serializeBigInt(data) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Portal] GET pedidos/seguimiento:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
