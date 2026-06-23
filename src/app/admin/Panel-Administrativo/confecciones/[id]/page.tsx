import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import ConfeccionDetalle from '@/components/admin/confecciones/detalle/ConfeccionDetalle';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConfeccionDetallePage({ params }: PageProps) {
  const { id } = await params;

  const conf = await prisma.confecciones.findUnique({
    where: { id: BigInt(id) },
    select: {
      id: true,
      prenda: true,
      cantidad: true,
      estado: true, // Mantiene la etapa actual guardada en la fila de la confección
      prioridad: true,
      costo_unitario: true,
      fecha_entrega: true,
      fecha_inicio: true,
      notas: true,
      observaciones: true,
      created_at: true,
      talleres: {
        select: {
          id: true,
          nombre: true,
          contacto: true,
          telefono: true,
          email: true,
          especialidad: true,
        },
      },
      ordenes_produccion: {
        select: {
          id: true,
          pedidos: {
            select: {
              id: true,
              estado: true,
              clientes: {
                select: {
                  razon_social: true,
                  nombre_comercial: true,
                },
              },
            },
          },
        },
      },
      seguimiento_confeccion: {
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          etapa_anterior: true,
          etapa_nuevo: true,
          notas: true,
          created_at: true,
          usuarios: {
            select: {
              id: true,
              personal_interno: {
                select: {
                  nombre_completo: true,
                }
              }
            },
          },
        },
      },
    },
  });

  if (!conf) notFound();

  const raw = serializeBigInt(conf) as any;

  const confeccion = {
    ...raw,
    taller: raw.talleres ?? null,
    pedido: raw.ordenes_produccion
      ? {
        id: raw.ordenes_produccion.id,
        estado: raw.ordenes_produccion.pedidos?.estado ?? null,
        cliente: raw.ordenes_produccion.pedidos?.clientes ?? null,
      }
      : null,
    seguimientos: raw.seguimiento_confeccion ?? [],
  };

  return <ConfeccionDetalle confeccion={confeccion} />;
}