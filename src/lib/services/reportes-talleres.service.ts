import { prisma } from '@/lib/prisma';

import type {
  ReporteTallerFilters,
  ReporteTallerItem,
  ReporteTallerResponse,
} from '@/types/reporte-talleres';

export async function getReporteTalleresExternos(
  filters?: ReporteTallerFilters,
): Promise<ReporteTallerResponse> {

  const ordenes = await prisma.ordenes_produccion.findMany({
    include: {
      talleres: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  let data: ReporteTallerItem[] = ordenes.map((orden) => {

    const avance = Math.floor(Math.random() * 100);

    let estado: ReporteTallerItem['estado'] = 'pendiente';
    if (avance >= 100) estado = 'completado';
    else if (avance >= 70) estado = 'en_proceso';
    else if (avance >= 30) estado = 'retrasado';

    return {
      id: Number(orden.id),
      taller: orden.talleres?.nombre || 'Taller General',
      pedido: `ORD-${orden.id}`,
      cantidad: Number(orden.cantidad_solicitada || 0),
      avance,
      fechaCompromiso:
        orden.fecha_entrega
          ?.toISOString()
          .split('T')[0] ||
        orden.created_at
          ?.toISOString()
          .split('T')[0] || '',
      estado,
    };
  });

  if (filters?.taller) {
    data = data.filter((item) =>
      item.taller.toLowerCase().includes(filters.taller!.toLowerCase())
    );
  }

  if (filters?.estado && filters.estado !== 'todos') {
    data = data.filter((item) => item.estado === filters.estado);
  }

  if (filters?.fechaInicio) {
    data = data.filter(
      (item) => new Date(item.fechaCompromiso) >= new Date(filters.fechaInicio!)
    );
  }

  if (filters?.fechaFin) {
    data = data.filter(
      (item) => new Date(item.fechaCompromiso) <= new Date(filters.fechaFin!)
    );
  }

  const totalAvance =
    data.length > 0
      ? data.reduce((acc, item) => acc + item.avance, 0) / data.length
      : 0;

  const totalUnidades = data.reduce((acc, item) => acc + item.cantidad, 0);

  return {
    stats: {
      talleresActivos: new Set(data.map((i) => i.taller)).size,
      pedidosProduccion: data.length,
      avancePromedio: Number(totalAvance.toFixed(1)),
      unidadesConfeccionadas: totalUnidades,
    },
    resumen: {
      completado: data.filter((i) => i.estado === 'completado').length,
      enProceso: data.filter((i) => i.estado === 'en_proceso').length,
      retrasado: data.filter((i) => i.estado === 'retrasado').length,
      pendiente: data.filter((i) => i.estado === 'pendiente').length,
      cumplimientoGeneral: Number(totalAvance.toFixed(1)),
    },
    data,
  };
}