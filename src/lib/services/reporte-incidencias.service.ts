import { prisma } from '@/lib/prisma';

import type {
  ReporteIncidenciaItem,
  ReporteIncidenciasResponse,
} from '@/types/reporte-incidencias';

interface ReporteIncidenciasFilters {
  severidad?: string;
  tipo?: string;
}

export async function getReporteIncidencias(
  filters?: ReporteIncidenciasFilters,
): Promise<ReporteIncidenciasResponse> {

  const where: any = {};

  // FILTRO SEVERIDAD
  if (filters?.severidad) {
    where.severidad =
      filters.severidad as any;
  }

  // FILTRO TIPO
  if (filters?.tipo) {
    where.tipo =
      filters.tipo as any;
  }

  // TRAER INCIDENCIAS
  const incidencias =
    await prisma.incidencias_taller.findMany({

      where,

      include: {
        confecciones: {
          include: {
            talleres: true,
          },
        },
      },

      orderBy: {
        created_at: 'desc',
      },
    });

  // TRANSFORMAR DATA
  const data: ReporteIncidenciaItem[] =
    incidencias.map((item) => ({

      id: Number(item.id),

      taller:
        item.confecciones?.talleres?.nombre ||
        'Sin taller',

      tipo:
        String(item.tipo || 'General'),

      severidad:
        String(item.severidad || 'media'),

      impactoHoras:
        Number(item.impacto_horas || 0),

      fecha:
        item.fecha_reporte
          ?.toISOString()
          .split('T')[0] || '',

      estado:
        item.resuelto
          ? 'Resuelto'
          : 'Pendiente',
    }));

  // KPIs
  const totalIncidencias =
    data.length;

  const incidenciasCriticas =
    data.filter(
      (i) =>
        i.severidad.toLowerCase() ===
        'critica'
    ).length;

  const talleresAfectados =
    new Set(
      data.map((i) => i.taller)
    ).size;

  const impactoHoras =
    data.reduce(
      (acc, item) =>
        acc + item.impactoHoras,
      0,
    );

  // RESUMEN SEVERIDAD
  const resumen = {

    baja:
      data.filter(
        (i) =>
          i.severidad.toLowerCase() ===
          'baja'
      ).length,

    media:
      data.filter(
        (i) =>
          i.severidad.toLowerCase() ===
          'media'
      ).length,

    alta:
      data.filter(
        (i) =>
          i.severidad.toLowerCase() ===
          'alta'
      ).length,

    critica:
      data.filter(
        (i) =>
          i.severidad.toLowerCase() ===
          'critica'
      ).length,
  };

  // VIEW SQL
  const mensualView =
    await prisma.$queryRaw<
      {
        nombre_mes: string;
        total_incidencias: bigint;
      }[]
    >`

      SELECT
        nombre_mes,
        total_incidencias,
        mes
      FROM vw_incidencias_mensuales
      ORDER BY mes ASC

    `;

  const mensual =
    mensualView.map((item) => ({

      mes:
        item.nombre_mes
          .trim()
          .slice(0, 3),

      total:
        Number(
          item.total_incidencias,
        ),

    }));

  return {

    stats: {

      totalIncidencias,

      incidenciasCriticas,

      talleresAfectados,

      impactoHoras,
    },

    resumen,

    mensual,

    data,
  };
}