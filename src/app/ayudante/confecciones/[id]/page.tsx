import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { listarTalleresActivosSelect } from '@/lib/helpers/confecciones-list.helper';
import { AyudanteConfeccionWorkspace } from '@/components/ayudante/AyudanteConfeccionWorkspace';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AyudanteConfeccionPage({ params }: PageProps) {
  const { id } = await params;

  const [conf, talleres] = await Promise.all([
    prisma.confecciones.findUnique({
      where: { id: BigInt(id) },
      include: {
        talleres: { select: { id: true, nombre: true } },
        ordenes_produccion: {
          include: {
            pedidos: {
              include: {
                clientes: {
                  select: { razon_social: true, nombre_comercial: true },
                },
                pedido_items: {
                  include: {
                    productos: { select: { id: true, nombre: true, sku: true } },
                    variantes_producto: {
                      select: { color: true, talla: true, sku: true },
                    },
                  },
                  orderBy: { id: 'asc' },
                },
              },
            },
          },
        },
      },
    }),
    listarTalleresActivosSelect(),
  ]);

  if (!conf) notFound();

  const pedidoRaw = conf.ordenes_produccion?.pedidos;
  const pedido = pedidoRaw
    ? (serializeBigInt(pedidoRaw) as unknown as {
        id: string | number;
        clientes: {
          razon_social: string | null;
          nombre_comercial: string | null;
        } | null;
        pedido_items: Array<{
          id: string | number;
          cantidad: number;
          productos: { nombre: string; sku: string | null } | null;
          variantes_producto: {
            color: string | null;
            talla: string | null;
            sku: string | null;
          } | null;
        }>;
      })
    : null;

  const cliente =
    pedido?.clientes?.razon_social ||
    pedido?.clientes?.nombre_comercial ||
    'Cliente';

  const pedidoItems =
    pedido?.pedido_items.map((item) => ({
      id: String(item.id),
      nombre: item.productos?.nombre ?? 'Producto',
      sku: item.productos?.sku ?? item.variantes_producto?.sku ?? null,
      color: item.variantes_producto?.color ?? null,
      talla: item.variantes_producto?.talla ?? null,
      cantidad: item.cantidad,
    })) ?? [];

  return (
    <AyudanteConfeccionWorkspace
      confeccion={{
        id: String(conf.id),
        estado: conf.estado,
        cantidad: conf.cantidad,
        tallerId: conf.talleres ? String(conf.talleres.id) : null,
        pedido: pedido
          ? {
              id: String(pedido.id),
              cliente,
            }
          : null,
        pedidoItems,
      }}
      talleres={talleres}
    />
  );
}
