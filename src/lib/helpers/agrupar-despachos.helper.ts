import { prisma } from '@/lib/prisma';
import { construirOrdenParadas } from '@/lib/helpers/orden-paradas-despacho.helper';

function toDateOnly(d: Date): Date {
  return new Date(d.toISOString().slice(0, 10));
}

function etiquetaRutaMultiParada(cantidad: number, fecha: Date): string {
  const fechaStr = fecha.toLocaleDateString('es-PE');
  return `Ruta multi-cliente (${cantidad} paradas) — ${fechaStr}`;
}

export async function agruparDespachosEnRuta(params: {
  despachoIds: bigint[];
  paradas?: Array<{ despacho_id: bigint; numero_parada: number }>;
  creadoPorAuthId?: string | null;
}): Promise<{ grupoId: bigint; despachoIds: bigint[] }> {
  const uniqueIds = [...new Set(params.despachoIds.map((id) => id))];

  if (uniqueIds.length < 2) {
    throw new Error('Selecciona al menos 2 despachos para agrupar en una ruta');
  }

  const despachos = await prisma.despachos.findMany({
    where: { id: { in: uniqueIds } },
    include: {
      despachos_grupo_pedidos: true,
      pedidos: {
        select: {
          clientes: { select: { razon_social: true } },
        },
      },
    },
  });

  if (despachos.length !== uniqueIds.length) {
    throw new Error('Uno o más despachos no existen');
  }

  const noPreparando = despachos.filter((d) => d.estado !== 'preparando');
  if (noPreparando.length > 0) {
    throw new Error('Solo se pueden agrupar despachos en estado preparando');
  }

  const grupoIds = new Set<bigint>();
  for (const despacho of despachos) {
    const link = despacho.despachos_grupo_pedidos[0];
    if (!link) {
      throw new Error(`El despacho #${despacho.id} no tiene grupo logístico asociado`);
    }
    grupoIds.add(link.grupo_despacho_id);
  }

  const ordenParadas = construirOrdenParadas(
    despachos.map((d) => ({
      despacho_id: d.id,
      direccion_entrega: d.direccion_entrega,
    })),
    params.paradas,
  );

  const primerDespachoId = ordenParadas[0]?.despacho_id;
  const primerDespacho = despachos.find((d) => d.id === primerDespachoId);
  if (!primerDespacho) {
    throw new Error('No se pudo determinar el despacho principal de la ruta');
  }

  const primerLink = primerDespacho.despachos_grupo_pedidos[0];
  if (!primerLink) {
    throw new Error('El despacho principal no tiene grupo asociado');
  }

  const targetGrupoId = primerLink.grupo_despacho_id;
  const fechaDespacho = toDateOnly(primerDespacho.fecha_despacho);
  const fechaEntrega = primerDespacho.fecha_entrega
    ? toDateOnly(primerDespacho.fecha_entrega)
    : null;

  const vacatedGrupoIds = [...grupoIds].filter((id) => id !== targetGrupoId);

  const resultado = await prisma.$transaction(async (tx) => {
    for (const parada of ordenParadas) {
      const despacho = despachos.find((d) => d.id === parada.despacho_id);
      if (!despacho) continue;

      const link = despacho.despachos_grupo_pedidos[0];
      if (!link) continue;

      if (link.grupo_despacho_id !== targetGrupoId) {
        await tx.despachos_grupo_pedidos.update({
          where: { id: link.id },
          data: {
            grupo_despacho_id: targetGrupoId,
            numero_parada: parada.numero_parada,
            estado_entrega: 'en_espera',
          },
        });
      } else {
        await tx.despachos_grupo_pedidos.update({
          where: { id: link.id },
          data: {
            numero_parada: parada.numero_parada,
            estado_entrega: 'en_espera',
          },
        });
      }
    }

    await tx.despachos_grupos.update({
      where: { id: targetGrupoId },
      data: {
        direccion_entrega: etiquetaRutaMultiParada(ordenParadas.length, fechaDespacho),
        fecha_despacho: fechaDespacho,
        fecha_entrega: fechaEntrega,
        estado: 'preparando',
        updated_at: new Date(),
      },
    });

    for (const vacatedId of vacatedGrupoIds) {
      const restantes = await tx.despachos_grupo_pedidos.count({
        where: { grupo_despacho_id: vacatedId },
      });
      if (restantes === 0) {
        await tx.despachos_grupos.delete({ where: { id: vacatedId } });
      }
    }

    await tx.seguimiento_despachos.create({
      data: {
        grupo_despacho_id: targetGrupoId,
        status: 'preparando',
        notas: `Ruta agrupada: ${ordenParadas.length} paradas (${despachos
          .map((d) => d.pedidos?.clientes?.razon_social ?? `pedido #${d.pedido_id}`)
          .join(' · ')})`,
        creado_por: params.creadoPorAuthId ?? null,
      },
    });

    return { grupoId: targetGrupoId, despachoIds: ordenParadas.map((p) => p.despacho_id) };
  });

  return resultado;
}
