import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

export const SoportePortalService = {
  async listarPedidosEntregados(clienteId: bigint) {
    const pedidos = await prisma.pedidos.findMany({
      where: {
        cliente_id: clienteId,
        estado: 'entregado',
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        estado: true,
        created_at: true,
        total: true,
        pedido_items: {
          select: {
            id: true,
            pedido_id: true,
            producto_id: true,
            variante_id: true,
            cantidad: true,
            productos: { select: { id: true, nombre: true, sku: true } },
            variantes_producto: {
              select: { id: true, color: true, talla: true, sku: true },
            },
          },
        },
      },
    });

    return serializeBigInt(pedidos);
  },
};
