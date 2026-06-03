import type { ColorPrenda, TallaProductos } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type ItemPedidoEntrada = {
  producto_id: number;
  variante_id?: number | null;
  cantidad: number;
  precio_unitario?: number;
  color_snapshot?: string;
  talla_snapshot?: string;
};

export type ItemPedidoResuelto = ItemPedidoEntrada & {
  variante_id: number;
};

/**
 * Obtiene variante_id válida para pedido_items (requerido en BD).
 */
export async function resolverVarianteIdPedido(
  item: ItemPedidoEntrada,
): Promise<bigint | null> {
  const productoId = BigInt(item.producto_id);

  if (item.variante_id != null && Number(item.variante_id) > 0) {
    const porId = await prisma.variantes_producto.findFirst({
      where: {
        id: BigInt(item.variante_id),
        producto_id: productoId,
        estado: 'activo',
      },
      select: { id: true },
    });
    if (porId) return porId.id;
  }

  const color = item.color_snapshot?.trim();
  const talla = item.talla_snapshot?.trim();
  if (color && talla) {
    const porAttrs = await prisma.variantes_producto.findFirst({
      where: {
        producto_id: productoId,
        color: color as ColorPrenda,
        talla: talla as TallaProductos,
        estado: 'activo',
      },
      select: { id: true },
    });
    if (porAttrs) return porAttrs.id;
  }

  const fallback = await prisma.variantes_producto.findFirst({
    where: { producto_id: productoId, estado: 'activo' },
    orderBy: [{ stock: 'desc' }, { id: 'asc' }],
    select: { id: true },
  });

  return fallback?.id ?? null;
}

export async function resolverItemsPedido(
  items: ItemPedidoEntrada[],
): Promise<{ items: ItemPedidoResuelto[] } | { error: string; producto_id?: number }> {
  const resueltos: ItemPedidoResuelto[] = [];

  for (const item of items) {
    const varianteId = await resolverVarianteIdPedido(item);
    if (!varianteId) {
      return {
        error: 'sin_variante_activa',
        producto_id: Number(item.producto_id),
      };
    }
    resueltos.push({
      ...item,
      variante_id: Number(varianteId),
    });
  }

  return { items: resueltos };
}
