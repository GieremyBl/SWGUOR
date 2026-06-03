import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { DisenadorPedidoWorkspace } from '@/components/disenador/DisenadorPedidoWorkspace';
import type { DetallePedidoData } from '@/components/admin/pedidos/detalles/types';
import type { FichaTecnicaData } from '@/components/disenador/FichaTecnicaDisenadorForm';
import {
  obtenerProgresoFichasPedido,
  pedidoFichasEnModoSoloLectura,
} from '@/lib/helpers/ficha-tecnica-pedido.helper';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DisenadorPedidoPage({ params }: PageProps) {
  const { id } = await params;

  const pedido = await prisma.pedidos.findUnique({
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
      cotizacion: { select: { id: true, numero: true } },
      pedido_items: {
        include: {
          productos: {
            select: { id: true, nombre: true, sku: true },
          },
          variantes_producto: {
            select: { id: true, color: true, talla: true, sku: true },
          },
        },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!pedido) notFound();

  const productosUnicos = new Map<
    string,
    { productoId: string; nombre: string; sku: string | null }
  >();

  for (const item of pedido.pedido_items) {
    if (!item.productos) continue;
    const pid = String(item.productos.id);
    if (!productosUnicos.has(pid)) {
      productosUnicos.set(pid, {
        productoId: pid,
        nombre: item.productos.nombre,
        sku: item.productos.sku,
      });
    }
  }

  const fichasPorProducto = await Promise.all(
    [...productosUnicos.values()].map(async (p) => {
      const ficha = await prisma.fichas_tecnicas.findFirst({
        where: { id_producto: BigInt(p.productoId) },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          version: true,
          descripcion_detallada: true,
          ficha_url: true,
          imagen_geometral: true,
          estado: true,
        },
      });

      const fichaData: FichaTecnicaData | null = ficha
        ? {
            id: String(ficha.id),
            version: ficha.version,
            descripcion_detallada: ficha.descripcion_detallada,
            ficha_url: ficha.ficha_url,
            imagen_geometral: ficha.imagen_geometral,
            estado: ficha.estado,
          }
        : null;

      return { ...p, ficha: fichaData };
    }),
  );

  const serializado = serializeBigInt(pedido) as Record<string, unknown>;

  const pedidoFormateado: DetallePedidoData = {
    ...(serializado as unknown as DetallePedidoData),
    pedido_items: (
      (serializado.pedido_items as DetallePedidoData['pedido_items']) ?? []
    ).map((item) => ({
      ...item,
      especificaciones:
        typeof item.especificaciones === 'object'
          ? item.especificaciones
          : null,
    })),
    cotizacion: serializado.cotizacion
      ? {
          id: String((serializado.cotizacion as { id: unknown }).id),
          numero: String((serializado.cotizacion as { numero: string }).numero),
        }
      : null,
  };

  const progresoFichas = await obtenerProgresoFichasPedido(pedido.id);
  const pedidoBloqueado = pedidoFichasEnModoSoloLectura(pedido.estado);

  return (
    <DisenadorPedidoWorkspace
      pedido={pedidoFormateado}
      productos={fichasPorProducto}
      progresoFichas={progresoFichas}
      pedidoBloqueado={pedidoBloqueado}
    />
  );
}
