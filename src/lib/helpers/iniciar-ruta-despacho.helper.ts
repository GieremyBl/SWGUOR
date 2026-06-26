import { prisma } from '@/lib/prisma';
import type { EstadoDespacho } from '@prisma/client';
import { registrarSeguimientoLogisticaPedido } from '@/lib/helpers/pedido-despacho-estado.helper';

const ESTADO_EN_RUTA = 'en_ruta' satisfies EstadoDespacho;

export async function iniciarRutaDespacho(params: {
  despachoId: bigint;
  creadoPorAuthId?: string | null;
}): Promise<{ despachoId: bigint; grupoId: bigint }> {
  const despacho = await prisma.despachos.findUnique({
    where: { id: params.despachoId },
    include: {
      despachos_grupo_pedidos: { take: 1 },
    },
  });

  if (!despacho) {
    throw new Error('Despacho no encontrado');
  }

  if (despacho.estado !== 'preparando') {
    throw new Error('Solo se puede iniciar ruta cuando el despacho está en preparando');
  }

  const grupoId = despacho.despachos_grupo_pedidos[0]?.grupo_despacho_id;
  if (!grupoId) {
    throw new Error('El despacho no tiene grupo logístico asociado');
  }

  const linksGrupo = await prisma.despachos_grupo_pedidos.findMany({
    where: { grupo_despacho_id: grupoId },
    select: { despacho_id: true, numero_parada: true, id: true, pedido_id: true },
    orderBy: { numero_parada: 'asc' },
  });

  const despachoIdsGrupo = linksGrupo.map((l) => l.despacho_id);

  await prisma.$transaction(async (tx) => {
    await tx.despachos.updateMany({
      where: { id: { in: despachoIdsGrupo } },
      data: { estado: ESTADO_EN_RUTA, updated_at: new Date() },
    });

    await tx.despachos_grupos.update({
      where: { id: grupoId },
      data: { estado: ESTADO_EN_RUTA, updated_at: new Date() },
    });

    const primeraParada = linksGrupo.find((l) => l.numero_parada === 1) ?? linksGrupo[0];
    if (primeraParada) {
      await tx.despachos_grupo_pedidos.update({
        where: { id: primeraParada.id },
        data: { estado_entrega: 'siguiente' },
      });
    }

    await tx.seguimiento_despachos.create({
      data: {
        grupo_despacho_id: grupoId,
        status: ESTADO_EN_RUTA,
        notas:
          despachoIdsGrupo.length > 1
            ? `Ruta iniciada — ${despachoIdsGrupo.length} paradas programadas.`
            : 'Transportista en ruta — salida de fábrica.',
        creado_por: params.creadoPorAuthId ?? null,
      },
    });

    const pedidoIds = [...new Set(linksGrupo.map((l) => l.pedido_id))];
    for (const pedidoId of pedidoIds) {
      await registrarSeguimientoLogisticaPedido(tx, {
        pedidoId,
        notas:
          despachoIdsGrupo.length > 1
            ? 'Pedido en camino — ruta grupal iniciada.'
            : 'Pedido en camino — transportista en ruta.',
        creadoPor: params.creadoPorAuthId ?? null,
      });
    }
  });

  return { despachoId: params.despachoId, grupoId };
}
