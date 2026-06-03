import { prisma } from '@/lib/prisma';
import type { EstadoDespacho } from '@prisma/client';

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

  await prisma.$transaction(async (tx) => {
    await tx.despachos.update({
      where: { id: params.despachoId },
      data: { estado: ESTADO_EN_RUTA, updated_at: new Date() },
    });

    await tx.despachos_grupos.update({
      where: { id: grupoId },
      data: { estado: ESTADO_EN_RUTA, updated_at: new Date() },
    });

    await tx.seguimiento_despachos.create({
      data: {
        grupo_despacho_id: grupoId,
        status: ESTADO_EN_RUTA,
        notas: 'Transportista en ruta — salida de fábrica.',
        creado_por: params.creadoPorAuthId ?? null,
      },
    });
  });

  return { despachoId: params.despachoId, grupoId };
}
