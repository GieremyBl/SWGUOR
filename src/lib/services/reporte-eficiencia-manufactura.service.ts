import { prisma } from '@/lib/prisma';
import {
  ESTADOS_OP_ACTIVAS,
  ESTADOS_OP_EXCLUIDAS,
  ETAPAS_MANUFACTURA_ORDEN,
} from '@/lib/constants/eficiencia-manufactura';
import {
  calcularCumplimientoFechas,
  calcularDuracionMinutos,
  calcularMinutosTranscurridos,
  clasificarUrgenciaEntrega,
  dentroVentanaAlerta,
  horasHastaEntrega,
  promedio,
  resolverTiempoEstimadoEtapa,
} from '@/lib/helpers/eficiencia-manufactura.helper';
import type {
  ManufacturaCuelloBotella,
  ManufacturaEtapaFunnel,
  ManufacturaKpis,
  ManufacturaPrioridadOp,
  ReporteManufacturaEficienciaResponse,
} from '@/lib/schemas/reporte-eficiencia-manufactura';
import { ETAPA_LABELS } from '@/lib/schemas/ordenes-produccion';

function labelEtapa(etapa: string): string {
  return ETAPA_LABELS[etapa as keyof typeof ETAPA_LABELS] ?? etapa;
}

async function calcularPromediosHistoricosPorEtapa(): Promise<Map<string, number>> {
  const historicos = await prisma.seguimiento_produccion.findMany({
    where: { completado_en: { not: null } },
    select: {
      etapa: true,
      iniciado_en: true,
      completado_en: true,
      duracion_minutos: true,
    },
  });

  const acumulado = new Map<string, number[]>();

  for (const registro of historicos) {
    const duracion = calcularDuracionMinutos(registro);
    if (duracion == null) continue;

    const lista = acumulado.get(registro.etapa) ?? [];
    lista.push(duracion);
    acumulado.set(registro.etapa, lista);
  }

  const promedios = new Map<string, number>();
  for (const [etapa, valores] of acumulado.entries()) {
    promedios.set(etapa, promedio(valores));
  }

  return promedios;
}

async function calcularKpis(): Promise<ManufacturaKpis> {
  const [ordenesActivas, confeccionHistorica, ordenesAnalisis, completadasConFecha] =
    await Promise.all([
      prisma.ordenes_produccion.count({
        where: { estado: { in: [...ESTADOS_OP_ACTIVAS] } },
      }),
      prisma.seguimiento_produccion.findMany({
        where: { etapa: 'confeccion', completado_en: { not: null } },
        select: { iniciado_en: true, completado_en: true, duracion_minutos: true },
      }),
      prisma.ordenes_produccion.aggregate({
        where: { estado: { notIn: [...ESTADOS_OP_EXCLUIDAS] } },
        _sum: { cantidad_solicitada: true },
      }),
      prisma.ordenes_produccion.findMany({
        where: {
          estado: 'completada',
          fecha_entrega: { not: null },
        },
        select: {
          fecha_entrega: true,
          updated_at: true,
          seguimiento_produccion: {
            where: { etapa: 'listo_entrega' },
            orderBy: { completado_en: 'desc' },
            take: 1,
            select: { completado_en: true },
          },
        },
      }),
    ]);

  const duracionesConfeccion = confeccionHistorica
    .map(calcularDuracionMinutos)
    .filter((value): value is number => value != null);

  const prendasSolicitadas = Number(ordenesAnalisis._sum.cantidad_solicitada ?? 0);

  const prendasProducidasAgg = await prisma.ordenes_produccion.aggregate({
    where: { estado: 'completada' },
    _sum: { cantidad_solicitada: true },
  });
  const prendasProducidas = Number(prendasProducidasAgg._sum.cantidad_solicitada ?? 0);

  const cumplimiento = calcularCumplimientoFechas(
    completadasConFecha.map((op) => ({
      fecha_entrega: op.fecha_entrega,
      completado_en:
        op.seguimiento_produccion[0]?.completado_en ??
        op.updated_at ??
        null,
    })),
  );

  const ratioProduccion =
    prendasSolicitadas > 0 ? (prendasProducidas / prendasSolicitadas) * 100 : 0;

  return {
    ordenes_activas: ordenesActivas,
    tiempo_promedio_confeccion_min: promedio(duracionesConfeccion),
    cumplimiento_fechas_pct: cumplimiento,
    prendas_producidas: prendasProducidas,
    prendas_solicitadas: prendasSolicitadas,
    ratio_produccion_pct: ratioProduccion,
  };
}

async function calcularFunnelEtapas(): Promise<ManufacturaEtapaFunnel[]> {
  const activos = await prisma.seguimiento_produccion.findMany({
    where: {
      activo: true,
      ordenes_produccion: {
        estado: { in: [...ESTADOS_OP_ACTIVAS] },
      },
    },
    select: { etapa: true },
  });

  const conteo = new Map<string, number>();
  for (const registro of activos) {
    conteo.set(registro.etapa, (conteo.get(registro.etapa) ?? 0) + 1);
  }

  return ETAPAS_MANUFACTURA_ORDEN.map((etapa) => ({
    etapa,
    label: labelEtapa(etapa),
    ordenes: conteo.get(etapa) ?? 0,
  }));
}

async function calcularCuellosBotella(
  promediosHistoricos: Map<string, number>,
): Promise<ManufacturaCuelloBotella[]> {
  const activos = await prisma.seguimiento_produccion.findMany({
    where: {
      activo: true,
      ordenes_produccion: {
        estado: { in: [...ESTADOS_OP_ACTIVAS] },
      },
    },
    select: {
      etapa: true,
      iniciado_en: true,
    },
  });

  const ahora = new Date();
  const tiemposActuales = new Map<string, number[]>();

  for (const registro of activos) {
    const elapsed = calcularMinutosTranscurridos(registro.iniciado_en, ahora);
    const lista = tiemposActuales.get(registro.etapa) ?? [];
    lista.push(elapsed);
    tiemposActuales.set(registro.etapa, lista);
  }

  const cuellos: ManufacturaCuelloBotella[] = [];

  for (const etapa of ETAPAS_MANUFACTURA_ORDEN) {
    const actuales = tiemposActuales.get(etapa);
    if (!actuales?.length) continue;

    const estimado = resolverTiempoEstimadoEtapa(etapa, promediosHistoricos);
    const actualPromedio = promedio(actuales);
    const exceso = Math.max(0, actualPromedio - estimado);

    if (exceso <= 0) continue;

    cuellos.push({
      etapa,
      label: labelEtapa(etapa),
      tiempo_estimado_min: estimado,
      tiempo_actual_promedio_min: actualPromedio,
      exceso_minutos: exceso,
      ordenes_activas: actuales.length,
    });
  }

  return cuellos.sort((a, b) => b.exceso_minutos - a.exceso_minutos).slice(0, 5);
}

async function calcularPrioridadOps(): Promise<ManufacturaPrioridadOp[]> {
  const ahora = new Date();

  const ordenes = await prisma.ordenes_produccion.findMany({
    where: {
      fecha_entrega: { not: null },
      estado: { in: [...ESTADOS_OP_ACTIVAS] },
    },
    include: {
      productos: { select: { nombre: true } },
      talleres: { select: { nombre: true } },
      seguimiento_produccion: {
        where: { activo: true },
        take: 1,
        select: { etapa: true },
      },
    },
    orderBy: { fecha_entrega: 'asc' },
  });

  return ordenes
    .filter((op) => op.fecha_entrega && dentroVentanaAlerta(op.fecha_entrega, ahora))
    .map((op) => {
      const etapaActual = op.seguimiento_produccion[0]?.etapa ?? op.etapa;
      const fechaEntrega = op.fecha_entrega!;

      return {
        id: Number(op.id),
        producto: op.productos.nombre,
        taller: op.talleres.nombre,
        etapa_actual: etapaActual,
        etapa_label: labelEtapa(etapaActual),
        fecha_entrega: fechaEntrega.toISOString(),
        horas_restantes: horasHastaEntrega(fechaEntrega, ahora),
        cantidad_solicitada: op.cantidad_solicitada,
        estado: op.estado,
        urgencia: clasificarUrgenciaEntrega(fechaEntrega, ahora),
      };
    });
}

export async function getReporteManufacturaEficiencia(): Promise<ReporteManufacturaEficienciaResponse> {
  const promediosHistoricos = await calcularPromediosHistoricosPorEtapa();

  const [kpis, etapas_funnel, cuellos_botella, prioridad_ops] = await Promise.all([
    calcularKpis(),
    calcularFunnelEtapas(),
    calcularCuellosBotella(promediosHistoricos),
    calcularPrioridadOps(),
  ]);

  return {
    success: true,
    kpis,
    etapas_funnel,
    cuellos_botella,
    prioridad_ops,
  };
}
