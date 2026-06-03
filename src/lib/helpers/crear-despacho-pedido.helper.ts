import { prisma } from '@/lib/prisma';
import { mergeNotasEmpaque } from '@/lib/helpers/pedido-notas-json.helper';

export interface ResultadoCrearDespacho {
  despachoId: bigint;
  grupoId: bigint;
}

function toDateOnly(d: Date): Date {
  return new Date(d.toISOString().slice(0, 10));
}

export async function crearDespachoPedido(params: {
  pedidoId: bigint;
  direccionEntrega: string;
  fechaEntregaEstimada: Date;
  fotosEmpaque: string[];
  notasEmpaque?: string;
  creadoPorAuthId?: string | null;
}): Promise<ResultadoCrearDespacho> {
  const pedido = await prisma.pedidos.findUnique({
    where: { id: params.pedidoId },
    select: {
      id: true,
      estado: true,
      notas_pedido: true,
      direccion_despacho: true,
    },
  });

  if (!pedido) {
    throw new Error('Pedido no encontrado');
  }

  if (pedido.estado !== 'listo_para_despacho') {
    throw new Error('El pedido debe estar en estado listo_para_despacho');
  }

  const despachoActivo = await prisma.despachos.findFirst({
    where: {
      pedido_id: params.pedidoId,
      estado: { in: ['preparando', 'en_ruta', 'pendiente'] },
    },
  });

  if (despachoActivo) {
    throw new Error('Ya existe un despacho activo para este pedido');
  }

  const direccion = params.direccionEntrega.trim();
  if (!direccion) {
    throw new Error('La dirección de entrega es obligatoria');
  }

  const ahora = new Date();
  const fechaEntrega = params.fechaEntregaEstimada;
  const notasPedido = mergeNotasEmpaque({
    raw: pedido.notas_pedido,
    fotos: params.fotosEmpaque,
    notas: params.notasEmpaque,
  });

  return prisma.$transaction(async (tx) => {
    await tx.pedidos.update({
      where: { id: params.pedidoId },
      data: {
        direccion_despacho: direccion,
        notas_pedido: notasPedido,
        updated_at: new Date(),
      },
    });

    const despacho = await tx.despachos.create({
      data: {
        pedido_id: params.pedidoId,
        fecha_despacho: ahora,
        direccion_entrega: direccion,
        fecha_entrega: fechaEntrega,
        estado: 'preparando',
      },
    });

    const grupo = await tx.despachos_grupos.create({
      data: {
        direccion_entrega: direccion,
        direccion_entrega_original: pedido.direccion_despacho,
        estado: 'preparando',
        fecha_despacho: toDateOnly(ahora),
        fecha_entrega: toDateOnly(fechaEntrega),
      },
    });

    await tx.despachos_grupo_pedidos.create({
      data: {
        grupo_despacho_id: grupo.id,
        despacho_id: despacho.id,
        pedido_id: params.pedidoId,
      },
    });

    await tx.seguimiento_despachos.create({
      data: {
        grupo_despacho_id: grupo.id,
        status: 'preparando',
        notas: params.notasEmpaque?.trim() || 'Despacho creado — empaque registrado.',
        creado_por: params.creadoPorAuthId ?? null,
      },
    });

    return { despachoId: despacho.id, grupoId: grupo.id };
  });
}
