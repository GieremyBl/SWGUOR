import type { Prisma } from '@prisma/client';

type CotizacionItemInput = {
  producto_id: bigint;
  variante_id: bigint;
  cantidad: number;
  precio_unitario_snapshot: Prisma.Decimal | number;
  subtotal: Prisma.Decimal | number;
  color_snapshot: string;
  talla_snapshot: string;
};

export function buildPedidoItemsFromCotizacion(
  pedidoId: bigint,
  items: CotizacionItemInput[],
): Prisma.pedido_itemsCreateManyInput[] {
  return items.map((item) => ({
    pedido_id: pedidoId,
    producto_id: item.producto_id,
    variante_id: item.variante_id,
    cantidad: item.cantidad,
    especificaciones: {
      color_snapshot: item.color_snapshot,
      talla_snapshot: item.talla_snapshot,
      precio_unitario: Number(item.precio_unitario_snapshot),
      subtotal: Number(item.subtotal),
    },
  }));
}
