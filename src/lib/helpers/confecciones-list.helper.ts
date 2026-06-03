import { prisma } from '@/lib/prisma';
import { stringifyBigInts } from '@/lib/utils/serialize';
import type { Prisma } from '@prisma/client';

export interface TallerSelectOption {
  id: string;
  nombre: string;
  especialidad: string | null;
}

export interface ConfeccionListItem {
  id: string;
  prenda: string;
  cantidad: number;
  estado: string;
  tallerId: string | null;
  tallerNombre: string;
  pedidoId: string | null;
}

/** Solo confecciones cuya orden ya tiene la etapa de corte completada. */
export const whereConfeccionConCorteCompletado: Prisma.confeccionesWhereInput = {
  ordenes_produccion: {
    seguimiento_produccion: {
      some: {
        etapa: 'corte',
        completado_en: { not: null },
      },
    },
  },
};

export async function listarTalleresActivosSelect(): Promise<TallerSelectOption[]> {
  const rows = await prisma.talleres.findMany({
    where: { estado: 'activo' },
    select: { id: true, nombre: true, especialidad: true },
    orderBy: { nombre: 'asc' },
  });

  const serializado = stringifyBigInts(rows) as unknown as Array<{
    id: string;
    nombre: string;
    especialidad: string | null;
  }>;

  return serializado.map((t) => ({
    id: String(t.id),
    nombre: t.nombre,
    especialidad: t.especialidad,
  }));
}

export async function listarConfeccionesParaOperaciones(filtros?: {
  tallerId?: string;
}): Promise<ConfeccionListItem[]> {
  const rows = await prisma.confecciones.findMany({
    where: {
      ...whereConfeccionConCorteCompletado,
      ...(filtros?.tallerId ? { taller_id: BigInt(filtros.tallerId) } : {}),
    },
    include: {
      talleres: { select: { id: true, nombre: true } },
      ordenes_produccion: {
        include: {
          pedidos: { select: { id: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const serializado = stringifyBigInts(rows) as unknown as Array<{
    id: string;
    prenda: string;
    cantidad: number;
    estado: string;
    talleres: { id: string; nombre: string } | null;
    ordenes_produccion: {
      pedidos: { id: string } | null;
    } | null;
  }>;

  return serializado.map((c) => ({
    id: String(c.id),
    prenda: c.prenda,
    cantidad: c.cantidad,
    estado: c.estado,
    tallerId: c.talleres?.id ? String(c.talleres.id) : null,
    tallerNombre: c.talleres?.nombre ?? '—',
    pedidoId: c.ordenes_produccion?.pedidos?.id
      ? String(c.ordenes_produccion.pedidos.id)
      : null,
  }));
}
