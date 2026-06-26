import { prisma } from '@/lib/prisma';

import type {
  ReporteIncidenciaItem,
  ReporteIncidenciasResponse,
} from '@/types/reporte-incidencias';

interface ReporteIncidenciasFilters {
  severidad?: string;
  tipo?: string;
}

// Nombres cortos de mes en español para el gráfico mensual
const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/**
 * Reporte de incidencias reportadas por CLIENTES (CUS_52).
 * Lee la tabla incidencias_cliente. Es independiente del reporte
 * de incidencias de taller (que sigue usando su propio servicio).
 */
export async function getReporteIncidenciasCliente(
  filters?: ReporteIncidenciasFilters,
): Promise<ReporteIncidenciasResponse> {

  const where: any = {};

  if (filters?.severidad) {
    where.severidad = filters.severidad as any;
  }

  if (filters?.tipo) {
    where.tipo = filters.tipo as any;
  }

  // TRAER INCIDENCIAS DE CLIENTE (con su cliente relacionado)
  const incidencias = await prisma.incidencias_cliente.findMany({
    where,
    include: {
      cliente: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  // TRANSFORMAR DATA
  // Reusamos el campo "taller" del tipo existente para mostrar el nombre del cliente,
  // así no hay que duplicar los componentes visuales.
  const data: ReporteIncidenciaItem[] = incidencias.map((item) => ({
    id: Number(item.id),

    taller:
      (item as any).cliente?.razon_social ||
      (item as any).cliente?.nombre ||
      'Sin cliente',

    tipo: String(item.tipo || 'General'),

    severidad: String(item.severidad || 'media'),

    impactoHoras: 0, // las incidencias de cliente no miden horas

    fecha:
      item.created_at
        ?.toISOString()
        .split('T')[0] || '',

    estado:
      item.estado === 'cerrada' || item.estado === 'resuelta'
        ? 'Resuelto'
        : 'Pendiente',

      evidencia: (item as any).evidencia_url || [],// ← agrega esta línea
  }));

  // KPIs
  const totalIncidencias = data.length;

  const incidenciasCriticas = data.filter(
    (i) => i.severidad.toLowerCase() === 'critica',
  ).length;

  // "talleresAfectados" se reutiliza como "clientes afectados"
  const talleresAfectados = new Set(
    data.map((i) => i.taller),
  ).size;

  const impactoHoras = 0;

  // RESUMEN SEVERIDAD
  const resumen = {
    baja: data.filter((i) => i.severidad.toLowerCase() === 'baja').length,
    media: data.filter((i) => i.severidad.toLowerCase() === 'media').length,
    alta: data.filter((i) => i.severidad.toLowerCase() === 'alta').length,
    critica: data.filter((i) => i.severidad.toLowerCase() === 'critica').length,
  };

  // RESUMEN MENSUAL (calculado desde los datos)
  const conteoPorMes = new Array(12).fill(0);
  for (const item of incidencias) {
    if (item.created_at) {
      conteoPorMes[item.created_at.getMonth()] += 1;
    }
  }
  const mensual = conteoPorMes.map((total, idx) => ({
    mes: MESES_CORTOS[idx],
    total,
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