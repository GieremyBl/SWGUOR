import { prisma } from '@/lib/prisma';
import { EMPRESA_GUOR } from '@/lib/constants/empresa';
import { mergeNotasEntrega } from '@/lib/helpers/pedido-notas-json.helper';
import { notificarTransicionEstadoPedido } from '@/lib/helpers/crear-notificacion.helper';
import { puedeTransicionar } from '@/lib/helpers/pedido-transiciones.helper';

export interface ResultadoConfirmarEntrega {
  despachoId: bigint;
  guiaId: bigint;
}

async function generarNumeroGuiaDespacho(pedidoId: bigint): Promise<string> {
  const count = await prisma.guias_remision.count({
    where: { pedido_id: pedidoId, tipo: 'despacho_cliente' },
  });
  return `GR-DESP-${String(pedidoId).padStart(5, '0')}-${String(count + 1).padStart(3, '0')}`;
}

function toDateOnly(d: Date): Date {
  return new Date(d.toISOString().slice(0, 10));
}

export async function confirmarEntregaPedido(params: {
  pedidoId: bigint;
  actaPdfUrl: string;
  fotosEntrega: string[];
  notasEntrega?: string;
  emitidoPor?: bigint;
  creadoPorAuthId?: string | null;
}): Promise<ResultadoConfirmarEntrega> {
  const pedido = await prisma.pedidos.findUnique({
    where: { id: params.pedidoId },
    select: {
      id: true,
      estado: true,
      cliente_id: true,
      notas_pedido: true,
      direccion_despacho: true,
    },
  });

  if (!pedido?.cliente_id) {
    throw new Error('Pedido no encontrado');
  }

  if (pedido.estado === 'entregado') {
    throw new Error('El pedido ya fue entregado');
  }

  if (!puedeTransicionar(pedido.estado, 'entregado')) {
    throw new Error(
      `No se puede confirmar entrega desde el estado actual: ${pedido.estado ?? 'desconocido'}`,
    );
  }

  const despacho = await prisma.despachos.findFirst({
    where: {
      pedido_id: params.pedidoId,
      estado: 'en_ruta',
    },
    orderBy: { created_at: 'desc' },
    include: {
      despachos_grupo_pedidos: { take: 1 },
    },
  });

  if (!despacho) {
    const enPreparacion = await prisma.despachos.findFirst({
      where: {
        pedido_id: params.pedidoId,
        estado: 'preparando',
      },
    });
    if (enPreparacion) {
      throw new Error(
        'El despacho aún está en preparación. Inicie la ruta desde Gestión de Despachos antes de confirmar la entrega.',
      );
    }
    throw new Error('No hay despacho en ruta para este pedido');
  }

  if (!params.actaPdfUrl?.trim()) {
    throw new Error('El acta de conformidad (PDF) es obligatoria');
  }

  const grupoLink = despacho.despachos_grupo_pedidos[0];
  const grupoId = grupoLink?.grupo_despacho_id;
  const direccion = despacho.direccion_entrega;
  const ahora = new Date();
  const estadoAnterior = pedido.estado;
  const notasPedido = mergeNotasEntrega({
    raw: pedido.notas_pedido,
    fotos: params.fotosEntrega,
    actaPdfUrl: params.actaPdfUrl,
    notas: params.notasEntrega,
  });

  const numeroGuia = await generarNumeroGuiaDespacho(params.pedidoId);

  const resultado = await prisma.$transaction(async (tx) => {
    await tx.despachos.update({
      where: { id: despacho.id },
      data: {
        estado: 'entregado',
        fecha_entrega: ahora,
        updated_at: ahora,
      },
    });

    if (grupoId) {
      await tx.despachos_grupos.update({
        where: { id: grupoId },
        data: {
          estado: 'entregado',
          fecha_entrega: toDateOnly(ahora),
          updated_at: ahora,
        },
      });

      await tx.seguimiento_despachos.create({
        data: {
          grupo_despacho_id: grupoId,
          status: 'entregado',
          notas: params.notasEntrega?.trim() || 'Entrega confirmada por administración.',
          creado_por: params.creadoPorAuthId ?? null,
        },
      });
    }

    const guia = await tx.guias_remision.create({
      data: {
        numero: numeroGuia,
        tipo: 'despacho_cliente',
        estado: 'entregada',
        origen_tipo: 'almacen',
        origen_direccion: EMPRESA_GUOR.direccion,
        destino_tipo: 'cliente',
        destino_direccion: direccion,
        pedido_id: params.pedidoId,
        fecha_traslado: toDateOnly(ahora),
        fecha_entrega: toDateOnly(ahora),
        pdf_url: params.actaPdfUrl,
        observaciones: params.notasEntrega?.trim() || null,
        emitido_por: params.emitidoPor ?? null,
      },
    });

    await tx.pedidos.update({
      where: { id: params.pedidoId },
      data: {
        estado: 'entregado',
        notas_pedido: notasPedido,
        updated_at: ahora,
      },
    });

    await tx.seguimiento_pedido.create({
      data: {
        pedido_id: params.pedidoId,
        status: 'entregado',
        notas: params.notasEntrega?.trim() || 'Pedido entregado al cliente.',
        creado_por: params.creadoPorAuthId ?? null,
      },
    });

    return { despachoId: despacho.id, guiaId: guia.id };
  });

  await notificarTransicionEstadoPedido({
    clienteId: pedido.cliente_id,
    pedidoId: params.pedidoId,
    estadoAnterior: estadoAnterior,
    estadoNuevo: 'entregado',
  });

  return resultado;
}
