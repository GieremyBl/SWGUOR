import { prisma } from '@/lib/prisma';

/** Registra etapa de diseño completada para el producto (sin notificar cortadores). */
export async function registrarDisenoFichaAprobada(params: {
  fichaId: bigint;
  productoId: bigint;
  pedidoId: bigint;
  usuarioId: bigint;
}): Promise<void> {
  const orden = await prisma.ordenes_produccion.findFirst({
    where: {
      pedido_id: params.pedidoId,
      producto_id: params.productoId,
    },
    orderBy: { created_at: 'desc' },
    select: { id: true },
  });

  if (!orden) return;

  const seguimientoExistente = await prisma.seguimiento_produccion.findFirst({
    where: {
      orden_id: orden.id,
      etapa: 'diseno',
      completado_en: { not: null },
    },
    select: { id: true },
  });

  if (seguimientoExistente) return;

  await prisma.seguimiento_produccion.create({
    data: {
      orden_id: orden.id,
      etapa: 'diseno',
      completado_en: new Date(),
      usuario_id: params.usuarioId,
      observaciones: `Ficha técnica #${params.fichaId} aprobada.`,
      activo: true,
    },
  });
}

/** @deprecated Usar aprobarFichaItemPedido + transicionarPedidoEnProduccionSiFichasCompletas */
export async function procesarFichaTecnicaAprobada(params: {
  fichaId: bigint;
  productoId: bigint;
  pedidoId: bigint;
  usuarioId: bigint;
}): Promise<void> {
  await registrarDisenoFichaAprobada(params);
}
