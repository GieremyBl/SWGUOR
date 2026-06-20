import { prisma } from '@/lib/prisma';
import {
  CONVERSION_MESES_TENDENCIA,
  CONVERSION_TOP_CLIENTES_LIMIT,
  EMBUDO_CONVERSION_ETAPAS,
  MOTIVOS_PERDIDA_COTIZACION,
  type MotivoPerdidaCotizacion,
} from '@/lib/constants/conversion-comercial';
import {
  calcularTasaCierre,
  clasificarMotivoPerdida,
  esCotizacionAprobada,
  esCotizacionConvertida,
  generarUltimosMeses,
  mesKeyFromDate,
} from '@/lib/helpers/conversion-comercial.helper';
import type {
  ConversionEmbudoEtapa,
  ConversionMotivoPerdida,
  ConversionTasaCierreMes,
  ConversionTopCliente,
  ReporteConversionComercialResponse,
} from '@/lib/schemas/reporte-conversion-comercial';

type CotizacionAnalisis = {
  estado: string | null;
  created_at: Date | null;
  aprobado_at: Date | null;
  cliente_id: bigint | null;
  valida_hasta: Date;
  _count: { pedidos: number };
};

async function fetchCotizacionesAnalisis(): Promise<CotizacionAnalisis[]> {
  return prisma.cotizaciones.findMany({
    where: { estado: { not: 'borrador' } },
    select: {
      estado: true,
      created_at: true,
      aprobado_at: true,
      cliente_id: true,
      valida_hasta: true,
      _count: { select: { pedidos: true } },
    },
  });
}

function calcularEmbudo(cotizaciones: CotizacionAnalisis[]): ConversionEmbudoEtapa[] {
  const creadas = cotizaciones.length;
  const aprobadas = cotizaciones.filter((c) =>
    esCotizacionAprobada(c.estado, c.aprobado_at),
  ).length;
  const convertidas = cotizaciones.filter((c) =>
    esCotizacionConvertida(c.estado, c._count.pedidos),
  ).length;

  const valores = { creadas, aprobadas, convertidas };

  return EMBUDO_CONVERSION_ETAPAS.map((etapa) => {
    const total = valores[etapa.key as keyof typeof valores];
    return {
      key: etapa.key,
      label: etapa.label,
      total,
      porcentaje: creadas > 0 ? (total / creadas) * 100 : 0,
    };
  });
}

function calcularTasaCierreMensual(
  cotizaciones: CotizacionAnalisis[],
): ConversionTasaCierreMes[] {
  const meses = generarUltimosMeses(CONVERSION_MESES_TENDENCIA);
  const creadasMap = new Map(meses.map((m) => [m.key, 0]));
  const convertidasMap = new Map(meses.map((m) => [m.key, 0]));

  for (const cot of cotizaciones) {
    if (!cot.created_at) continue;
    const key = mesKeyFromDate(new Date(cot.created_at));
    if (!creadasMap.has(key)) continue;

    creadasMap.set(key, (creadasMap.get(key) ?? 0) + 1);

    if (esCotizacionConvertida(cot.estado, cot._count.pedidos)) {
      convertidasMap.set(key, (convertidasMap.get(key) ?? 0) + 1);
    }
  }

  return meses.map((mes) => {
    const creadas = creadasMap.get(mes.key) ?? 0;
    const convertidas = convertidasMap.get(mes.key) ?? 0;
    return {
      mes: mes.label,
      creadas,
      convertidas,
      tasa_cierre_pct: calcularTasaCierre(convertidas, creadas),
    };
  });
}

async function calcularTopClientes(): Promise<ConversionTopCliente[]> {
  const agrupado = await prisma.pedidos.groupBy({
    by: ['cliente_id', 'moneda'],
    where: {
      cliente_id: { not: null },
      estado: { not: 'cancelado' },
    },
    _sum: { total: true },
    _count: { id: true },
    orderBy: { _sum: { total: 'desc' } },
    take: CONVERSION_TOP_CLIENTES_LIMIT * 2,
  });

  const clienteIds = [
    ...new Set(
      agrupado
        .map((row) => row.cliente_id)
        .filter((id): id is bigint => id != null)
        .map((id) => Number(id)),
    ),
  ].slice(0, CONVERSION_TOP_CLIENTES_LIMIT);

  if (!clienteIds.length) return [];

  const clientes = await prisma.clientes.findMany({
    where: { id: { in: clienteIds.map((id) => BigInt(id)) } },
    select: { id: true, razon_social: true, nombre_comercial: true, ruc: true },
  });

  const clienteMap = new Map(clientes.map((c) => [Number(c.id), c]));

  const totalesPorCliente = new Map<number, ConversionTopCliente>();

  for (const row of agrupado) {
    if (!row.cliente_id) continue;
    const clienteId = Number(row.cliente_id);
    if (!clienteIds.includes(clienteId)) continue;

    const existente = totalesPorCliente.get(clienteId);
    const monto = Number(row._sum.total ?? 0);

    if (existente) {
      existente.total_facturado += monto;
      existente.pedidos_count += row._count.id;
      continue;
    }

    const cliente = clienteMap.get(clienteId);
    totalesPorCliente.set(clienteId, {
      cliente_id: clienteId,
      razon_social:
        cliente?.razon_social ?? cliente?.nombre_comercial ?? 'Cliente sin nombre',
      ruc: cliente?.ruc ?? null,
      total_facturado: monto,
      pedidos_count: row._count.id,
      moneda: row.moneda,
    });
  }

  return Array.from(totalesPorCliente.values())
    .sort((a, b) => b.total_facturado - a.total_facturado)
    .slice(0, CONVERSION_TOP_CLIENTES_LIMIT);
}

async function calcularAnalisisPerdida(): Promise<ConversionMotivoPerdida[]> {
  const expiradas = await prisma.cotizaciones.findMany({
    where: { estado: 'expirada' },
    select: {
      cliente_id: true,
      aprobado_at: true,
      valida_hasta: true,
      expira_at: true,
      _count: { select: { pedidos: true } },
    },
  });

  const conteo = new Map<MotivoPerdidaCotizacion, number>();
  for (const key of Object.keys(MOTIVOS_PERDIDA_COTIZACION) as MotivoPerdidaCotizacion[]) {
    conteo.set(key, 0);
  }

  for (const cot of expiradas) {
    const motivo = clasificarMotivoPerdida({
      cliente_id: cot.cliente_id,
      aprobado_at: cot.aprobado_at,
      valida_hasta: cot.valida_hasta,
      pedidos_count: cot._count.pedidos,
    });
    conteo.set(motivo, (conteo.get(motivo) ?? 0) + 1);
  }

  const total = expiradas.length || 1;

  return (Object.keys(MOTIVOS_PERDIDA_COTIZACION) as MotivoPerdidaCotizacion[])
    .map((motivo) => ({
      motivo,
      label: MOTIVOS_PERDIDA_COTIZACION[motivo],
      total: conteo.get(motivo) ?? 0,
      porcentaje: ((conteo.get(motivo) ?? 0) / total) * 100,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
}

export async function getReporteConversionComercial(): Promise<ReporteConversionComercialResponse> {
  const cotizaciones = await fetchCotizacionesAnalisis();

  const embudo = calcularEmbudo(cotizaciones);
  const tasa_cierre_mensual = calcularTasaCierreMensual(cotizaciones);
  const convertidasGlobal = cotizaciones.filter((c) =>
    esCotizacionConvertida(c.estado, c._count.pedidos),
  ).length;

  const [top_clientes, analisis_perdida] = await Promise.all([
    calcularTopClientes(),
    calcularAnalisisPerdida(),
  ]);

  return {
    success: true,
    embudo,
    tasa_cierre_mensual,
    tasa_cierre_global_pct: calcularTasaCierre(convertidasGlobal, cotizaciones.length),
    top_clientes,
    analisis_perdida,
  };
}
