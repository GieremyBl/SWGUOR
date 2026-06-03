import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { CortadorPedidoWorkspace } from '@/components/cortador/CortadorPedidoWorkspace';
import type { DetallePedidoData } from '@/components/admin/pedidos/detalles/types';
import {
  obtenerDatosFichaParaCorte,
  obtenerEstadoCortePedido,
  obtenerItemsConFichaParaCorte,
} from '@/lib/helpers/registrar-corte-pedido.helper';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function resolverProductoPrincipalId(
  items: Array<{
    cantidad: number;
    producto_id?: bigint | null;
    productos?: { id: bigint; nombre: string } | null;
  }>,
): bigint {
  const acumulado = new Map<string, number>();

  for (const item of items) {
    const pid = item.productos?.id ?? item.producto_id;
    if (!pid) continue;
    acumulado.set(String(pid), (acumulado.get(String(pid)) ?? 0) + item.cantidad);
  }

  let mejorId = items[0]?.productos?.id ?? items[0]?.producto_id ?? BigInt(0);
  let maxCant = 0;

  for (const [id, cant] of acumulado) {
    if (cant > maxCant) {
      maxCant = cant;
      mejorId = BigInt(id);
    }
  }

  return mejorId;
}

export default async function CortadorPedidoPage({ params }: PageProps) {
  const { id } = await params;
  const pedidoId = BigInt(id);

  const pedido = await prisma.pedidos.findUnique({
    where: { id: pedidoId },
    include: {
      clientes: {
        select: {
          id: true,
          ruc: true,
          razon_social: true,
          nombre_comercial: true,
          telefono: true,
          email: true,
          tipo_cliente: true,
        },
      },
      cotizacion: { select: { id: true, numero: true } },
      pedido_items: {
        include: {
          productos: { select: { id: true, nombre: true, sku: true } },
          variantes_producto: {
            select: { id: true, color: true, talla: true, sku: true },
          },
        },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!pedido) notFound();

  const itemsConFicha = await obtenerItemsConFichaParaCorte(pedido.pedido_items);

  const productoPrincipalId = resolverProductoPrincipalId(pedido.pedido_items);
  const fichaPrincipal = await obtenerDatosFichaParaCorte(productoPrincipalId);

  const { corteCompletado, ordenId } = await obtenerEstadoCortePedido(pedidoId);
  const puedeRegistrarCorte = pedido.estado === 'en_produccion' && Boolean(fichaPrincipal);

  const serializado = serializeBigInt(pedido) as Record<string, unknown>;

  const pedidoFormateado: DetallePedidoData = {
    ...(serializado as unknown as DetallePedidoData),
    pedido_items: (
      (serializado.pedido_items as DetallePedidoData['pedido_items']) ?? []
    ).map((item) => ({
      ...item,
      especificaciones:
        typeof item.especificaciones === 'object' ? item.especificaciones : null,
    })),
    cotizacion: serializado.cotizacion
      ? {
          id: String((serializado.cotizacion as { id: unknown }).id),
          numero: String((serializado.cotizacion as { numero: string }).numero),
        }
      : null,
  };

  return (
    <CortadorPedidoWorkspace
      pedido={pedidoFormateado}
      itemsConFicha={itemsConFicha}
      corteCompletado={corteCompletado}
      ordenId={ordenId}
      puedeRegistrarCorte={puedeRegistrarCorte}
    />
  );
}
