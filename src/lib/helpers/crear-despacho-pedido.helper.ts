import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mergeNotasEmpaque } from '@/lib/helpers/pedido-notas-json.helper';

export interface ResultadoCrearDespacho {
  despachoId: bigint;
  grupoId: bigint;
}

function toDateOnly(d: Date): Date {
  return new Date(d.toISOString().slice(0, 10));
}

/**
 * Crea un despacho "marcador" (estado `pendiente`) apenas el pedido queda pagado,
 * solo para que el ayudante lo vea en Gestión de Despachos antes de que producción
 * lo empaque. No habilita Iniciar Ruta ni Confirmar entrega — eso sigue requiriendo
 * el empaque real vía `crearDespachoPedido`, que luego reemplaza este marcador.
 */
export async function crearDespachoPlaceholderPagoPedido(
  tx: Prisma.TransactionClient,
  pedido: { id: bigint; direccion_despacho: string | null },
): Promise<void> {
  const yaExiste = await tx.despachos.findFirst({
    where: { pedido_id: pedido.id },
    select: { id: true },
  });
  if (yaExiste) return;

  await tx.despachos.create({
    data: {
      pedido_id: pedido.id,
      fecha_despacho: new Date(),
      direccion_entrega: pedido.direccion_despacho?.trim() || 'Dirección por confirmar',
      estado: 'pendiente',
    },
  });
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
      estado: { in: ['preparando', 'en_ruta'] },
    },
  });

  if (despachoActivo) {
    throw new Error('Ya existe un despacho activo para este pedido');
  }

  // Marcador creado automáticamente al pagar (ver crearDespachoPlaceholderPagoPedido):
  // se actualiza con los datos reales de empaque en vez de crear uno nuevo.
  const despachoPlaceholder = await prisma.despachos.findFirst({
    where: { pedido_id: params.pedidoId, estado: 'pendiente' },
  });

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

    const despacho = despachoPlaceholder
      ? await tx.despachos.update({
          where: { id: despachoPlaceholder.id },
          data: {
            fecha_despacho: ahora,
            direccion_entrega: direccion,
            fecha_entrega: fechaEntrega,
            estado: 'preparando',
            updated_at: ahora,
          },
        })
      : await tx.despachos.create({
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
