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
      pedidos: { select: { total_unidades: true } },
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

  const verificacionAlmacen = await prisma.seguimiento_despachos.findFirst({
    where: {
      grupo_despacho_id: grupoId,
      status: 'preparando',
      notas: { contains: 'VERIFICACION_ALMACEN_OK' },
    },
    orderBy: { created_at: 'desc' },
  });

  if (!verificacionAlmacen?.notas) {
    throw new Error(
      'No se puede iniciar ruta sin verificación previa de almacén sobre cantidades entregadas.',
    );
  }

  const match = verificacionAlmacen.notas.match(/VERIFICACION_ALMACEN_OK\s+(\{.*\})/s);
  if (!match?.[1]) {
    throw new Error('La verificación de almacén registrada es inválida.');
  }

  let cantidadVerificada: number | null = null;
  try {
    const payload = JSON.parse(match[1]) as { cantidad_verificada?: number };
    cantidadVerificada = Number(payload.cantidad_verificada ?? NaN);
  } catch {
    throw new Error('No se pudo interpretar la verificación de almacén registrada.');
  }

  const cantidadPedida = Number(despacho.pedidos.total_unidades ?? 0);
  if (!Number.isFinite(cantidadVerificada) || cantidadVerificada !== cantidadPedida) {
    throw new Error(
      `La verificación de almacén no coincide con lo solicitado (pedido: ${cantidadPedida}, verificado: ${cantidadVerificada ?? 'n/a'}).`,
    );
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
