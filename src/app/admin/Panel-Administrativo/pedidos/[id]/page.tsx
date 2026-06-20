import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { getServerAuthUser } from '@/lib/auth/server';
import PedidoDetalle, {
  type DetallePedidoData,
} from '@/components/admin/pedidos/detalles/PedidoDetalle';
import {
  mapCotizacionItemsToPedidoItems,
  mapPedidoItemRow,
} from '@/lib/helpers/pedido-items-display.helper';
import { obtenerDocumentosPedidoAdmin } from '@/lib/services/comprobante-documento.service';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

const ROLES_CAMBIO_ESTADO = ['administrador', 'gerente'] as const;

export default async function PedidoDetallePage({ params }: PageProps) {
  const { id } = await params;

  const auth = await getServerAuthUser();
  if (!auth.success) {
    notFound();
  }

  const puedeCambiarEstado = ROLES_CAMBIO_ESTADO.includes(
    auth.user.rol as (typeof ROLES_CAMBIO_ESTADO)[number],
  );

  let pedido;

  try {
    pedido = await prisma.pedidos.findUnique({
      where: { id: BigInt(id) },
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
        cotizacion: {
          select: {
            id: true,
            numero: true,
            cotizacion_items: {
              include: {
                productos: {
                  select: { id: true, nombre: true, sku: true, imagen: true },
                },
                variantes_producto: {
                  select: { id: true, color: true, talla: true, sku: true },
                },
              },
              orderBy: { id: 'asc' },
            },
          },
        },
        pedido_items: {
          include: {
            productos: {
              select: {
                id: true,
                nombre: true,
                sku: true,
                imagen: true,
              },
            },
            variantes_producto: {
              select: {
                id: true,
                color: true,
                talla: true,
                sku: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
        seguimiento_pedido: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!pedido) notFound();
  } catch (error) {
    console.error('[PedidoDetallePage] Error cargando pedido:', error);
    notFound();
  }

  const itemsDisplay =
    pedido.pedido_items.length > 0
      ? pedido.pedido_items.map((item) => mapPedidoItemRow(item))
      : pedido.cotizacion?.cotizacion_items
        ? mapCotizacionItemsToPedidoItems(pedido.cotizacion.cotizacion_items)
        : [];

  const documentos = await obtenerDocumentosPedidoAdmin(pedido.id);

  const serializado = serializeBigInt(pedido) as Record<string, unknown>;

  const pedidoFormateado: DetallePedidoData = {
    ...(serializado as unknown as DetallePedidoData),
    pedido_items: itemsDisplay,
    documentos,
    seguimiento_pedido: (
      (serializado.seguimiento_pedido as Array<Record<string, unknown>>) ?? []
    ).map((s) => ({
      id: String(s.id),
      estado: String(s.status ?? s.estado ?? 'pendiente'),
      notas: (s.notas as string | null) ?? null,
      created_at: (s.created_at as string | null) ?? null,
      created_by: (s.creado_por as string | null) ?? null,
    })),
    cotizacion: serializado.cotizacion
      ? {
          id: String((serializado.cotizacion as { id: unknown }).id),
          numero: String((serializado.cotizacion as { numero: string }).numero),
        }
      : null,
  };

  return (
    <PedidoDetalle
      pedido={pedidoFormateado}
      puedeCambiarEstado={puedeCambiarEstado}
    />
  );
}
