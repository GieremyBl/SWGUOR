import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Prisma } from '@prisma/client';

const ITEM_INCLUDE = {
  pedido_items: { select: { id: true, cantidad: true } },
  productos: { select: { id: true, nombre: true, sku: true } },
  variantes_producto: { select: { id: true, talla: true, color: true } },
} as const;

export interface OrdenProduccionItemInput {
  pedido_item_id: string | number;
  producto_id: string | number;
  variante_id?: string | number | null;
  cantidad: number;
}

async function asegurarOrdenExiste(orden_produccion_id: string) {
  const orden = await prisma.ordenes_produccion.findUnique({
    where: { id: BigInt(orden_produccion_id) },
    select: { id: true, pedido_id: true },
  });
  if (!orden) throw new Error('Orden de producción no encontrada');
  return orden;
}

async function validarPedidoItem(
  pedido_item_id: string | number,
  producto_id: string | number,
  pedido_id_orden: bigint | null,
) {
  const pedidoItem = await prisma.pedido_items.findUnique({
    where: { id: BigInt(pedido_item_id) },
    select: { id: true, pedido_id: true, producto_id: true, variante_id: true },
  });
  if (!pedidoItem) throw new Error('Ítem de pedido no encontrado');

  if (pedido_id_orden != null && pedidoItem.pedido_id !== pedido_id_orden) {
    throw new Error('El ítem de pedido no pertenece al pedido vinculado a esta orden');
  }

  if (pedidoItem.producto_id && pedidoItem.producto_id !== BigInt(producto_id)) {
    throw new Error('El producto no coincide con el ítem de pedido seleccionado');
  }

  return pedidoItem;
}

function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new Error('Ya existe un ítem con el mismo pedido o producto en esta orden');
    }
    if (error.code === 'P2025') {
      throw new Error('Ítem no encontrado');
    }
  }
  throw error;
}

export const OrdenesProduccionItemsService = {

  async obtenerPorOrden(orden_produccion_id: string) {
    await asegurarOrdenExiste(orden_produccion_id);

    const items = await prisma.ordenes_produccion_items.findMany({
      where: { orden_produccion_id: BigInt(orden_produccion_id) },
      include: ITEM_INCLUDE,
      orderBy: { id: 'asc' },
    });

    return serializeBigInt(items);
  },

  async agregarItem(orden_produccion_id: string, item: OrdenProduccionItemInput) {
    if (item.cantidad < 1) throw new Error('La cantidad debe ser al menos 1');

    const orden = await asegurarOrdenExiste(orden_produccion_id);
    await validarPedidoItem(item.pedido_item_id, item.producto_id, orden.pedido_id);

    const producto = await prisma.productos.findUnique({
      where: { id: BigInt(item.producto_id) },
      select: { id: true },
    });
    if (!producto) throw new Error('Producto no encontrado');

    if (item.variante_id) {
      const variante = await prisma.variantes_producto.findUnique({
        where: { id: BigInt(item.variante_id) },
        select: { id: true, producto_id: true },
      });
      if (!variante) throw new Error('Variante no encontrada');
      if (variante.producto_id !== BigInt(item.producto_id)) {
        throw new Error('La variante no pertenece al producto indicado');
      }
    }

    try {
      const created = await prisma.ordenes_produccion_items.create({
        data: {
          orden_produccion_id: BigInt(orden_produccion_id),
          pedido_item_id: BigInt(item.pedido_item_id),
          producto_id: BigInt(item.producto_id),
          variante_id: item.variante_id ? BigInt(item.variante_id) : null,
          cantidad: item.cantidad,
        },
        include: ITEM_INCLUDE,
      });
      return serializeBigInt(created);
    } catch (error) {
      mapPrismaError(error);
    }
  },

  async actualizarItem(id: string, data: Partial<OrdenProduccionItemInput>) {
    const existente = await prisma.ordenes_produccion_items.findUnique({
      where: { id: BigInt(id) },
      include: { ordenes_produccion: { select: { pedido_id: true } } },
    });
    if (!existente) throw new Error('Ítem de orden no encontrado');

    const pedido_item_id = data.pedido_item_id ?? existente.pedido_item_id.toString();
    const producto_id = data.producto_id ?? existente.producto_id.toString();
    const cantidad = data.cantidad ?? existente.cantidad;

    if (cantidad < 1) throw new Error('La cantidad debe ser al menos 1');

    await validarPedidoItem(
      pedido_item_id,
      producto_id,
      existente.ordenes_produccion.pedido_id,
    );

    const variante_id = data.variante_id !== undefined
      ? data.variante_id
      : existente.variante_id?.toString() ?? null;

    if (variante_id) {
      const variante = await prisma.variantes_producto.findUnique({
        where: { id: BigInt(variante_id) },
        select: { id: true, producto_id: true },
      });
      if (!variante) throw new Error('Variante no encontrada');
      if (variante.producto_id !== BigInt(producto_id)) {
        throw new Error('La variante no pertenece al producto indicado');
      }
    }

    try {
      const updated = await prisma.ordenes_produccion_items.update({
        where: { id: BigInt(id) },
        data: {
          ...(data.pedido_item_id !== undefined && {
            pedido_item_id: BigInt(data.pedido_item_id),
          }),
          ...(data.producto_id !== undefined && { producto_id: BigInt(data.producto_id) }),
          ...(data.variante_id !== undefined && {
            variante_id: data.variante_id ? BigInt(data.variante_id) : null,
          }),
          ...(data.cantidad !== undefined && { cantidad: data.cantidad }),
          updated_at: new Date(),
        },
        include: ITEM_INCLUDE,
      });
      return serializeBigInt(updated);
    } catch (error) {
      mapPrismaError(error);
    }
  },

  async eliminarItem(id: string) {
    const existente = await prisma.ordenes_produccion_items.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!existente) throw new Error('Ítem de orden no encontrado');

    await prisma.ordenes_produccion_items.delete({ where: { id: BigInt(id) } });
    return { success: true };
  },
};
