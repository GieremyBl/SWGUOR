import { prisma } from '@/lib/prisma';
import {
  ANALITICA_FINANCIERA_MESES_TENDENCIA,
  type MonedaAnaliticaFiltro,
} from '@/lib/constants/analitica-financiera';
import {
  buildCuentasPorCobrarWhere,
  buildPagosRecaudadosWhere,
  buildPedidosVentasWhere,
  calcularPorcentajeMorosidad,
  generarUltimosMeses,
  mesKeyFromDate,
} from '@/lib/helpers/analitica-financiera.helper';
import type {
  AnaliticaFinancieraDeudor,
  AnaliticaFinancieraKpis,
  AnaliticaFinancieraTendenciaMes,
  ReporteAnaliticaFinancieraQuery,
  ReporteAnaliticaFinancieraResponse,
} from '@/lib/schemas/reporte-analitica-financiera';

async function calcularKpis(moneda: MonedaAnaliticaFiltro): Promise<AnaliticaFinancieraKpis> {
  const [ventasAgg, recaudadoAgg, deudaAgg] = await Promise.all([
    prisma.pedidos.aggregate({
      where: buildPedidosVentasWhere(moneda),
      _sum: { total: true },
    }),
    prisma.pagos.aggregate({
      where: buildPagosRecaudadosWhere(moneda),
      _sum: { monto: true },
    }),
    prisma.pedidos.aggregate({
      where: buildCuentasPorCobrarWhere(moneda),
      _sum: { saldo_pendiente: true },
    }),
  ]);

  const ingresosTotales = Number(ventasAgg._sum.total ?? 0);
  const montoRecaudado = Number(recaudadoAgg._sum.monto ?? 0);
  const saldoPendiente = Number(deudaAgg._sum.saldo_pendiente ?? 0);

  return {
    ingresos_totales: ingresosTotales,
    monto_recaudado: montoRecaudado,
    saldo_pendiente: saldoPendiente,
    porcentaje_morosidad: calcularPorcentajeMorosidad(saldoPendiente, ingresosTotales),
  };
}

async function calcularTendencia(
  moneda: MonedaAnaliticaFiltro,
): Promise<AnaliticaFinancieraTendenciaMes[]> {
  const meses = generarUltimosMeses(ANALITICA_FINANCIERA_MESES_TENDENCIA);
  const inicio = meses[0]?.start ?? new Date();

  const ventasMap = new Map<string, number>(
    meses.map((m) => [m.key, 0]),
  );
  const pagosMap = new Map<string, number>(
    meses.map((m) => [m.key, 0]),
  );

  const [pedidos, pagos] = await Promise.all([
    prisma.pedidos.findMany({
      where: {
        ...buildPedidosVentasWhere(moneda),
        created_at: { gte: inicio },
      },
      select: { total: true, created_at: true },
    }),
    prisma.pagos.findMany({
      where: {
        ...buildPagosRecaudadosWhere(moneda),
        fecha_pago: { gte: inicio },
      },
      select: { monto: true, fecha_pago: true },
    }),
  ]);

  for (const pedido of pedidos) {
    if (!pedido.created_at) continue;
    const key = mesKeyFromDate(new Date(pedido.created_at));
    if (!ventasMap.has(key)) continue;
    ventasMap.set(key, (ventasMap.get(key) ?? 0) + Number(pedido.total ?? 0));
  }

  for (const pago of pagos) {
    const key = mesKeyFromDate(new Date(pago.fecha_pago));
    if (!pagosMap.has(key)) continue;
    pagosMap.set(key, (pagosMap.get(key) ?? 0) + Number(pago.monto ?? 0));
  }

  return meses.map((mes) => ({
    mes: mes.label,
    ventas: ventasMap.get(mes.key) ?? 0,
    pagos: pagosMap.get(mes.key) ?? 0,
  }));
}

async function calcularTopDeudores(
  moneda: MonedaAnaliticaFiltro,
): Promise<AnaliticaFinancieraDeudor[]> {
  const pedidos = await prisma.pedidos.findMany({
    where: buildCuentasPorCobrarWhere(moneda),
    select: {
      saldo_pendiente: true,
      moneda: true,
      cliente_id: true,
      clientes: {
        select: {
          id: true,
          razon_social: true,
          nombre_comercial: true,
          ruc: true,
        },
      },
    },
  });

  const deudaPorCliente = new Map<number, AnaliticaFinancieraDeudor>();

  for (const pedido of pedidos) {
    if (!pedido.cliente_id || !pedido.clientes) continue;

    const clienteId = Number(pedido.cliente_id);
    const deuda = Number(pedido.saldo_pendiente ?? 0);
    if (deuda <= 0) continue;

    const existente = deudaPorCliente.get(clienteId);
    if (existente) {
      existente.deuda_total += deuda;
      existente.pedidos_con_deuda += 1;
      continue;
    }

    deudaPorCliente.set(clienteId, {
      cliente_id: clienteId,
      razon_social:
        pedido.clientes.razon_social ??
        pedido.clientes.nombre_comercial ??
        'Cliente sin nombre',
      ruc: pedido.clientes.ruc ?? null,
      moneda: pedido.moneda,
      deuda_total: deuda,
      pedidos_con_deuda: 1,
    });
  }

  return Array.from(deudaPorCliente.values())
    .sort((a, b) => b.deuda_total - a.deuda_total)
    .slice(0, 10);
}

export async function getReporteAnaliticaFinanciera(
  query: ReporteAnaliticaFinancieraQuery,
): Promise<ReporteAnaliticaFinancieraResponse> {
  const moneda = query.moneda;

  const [kpis, tendencia, top_deudores] = await Promise.all([
    calcularKpis(moneda),
    calcularTendencia(moneda),
    calcularTopDeudores(moneda),
  ]);

  return {
    success: true,
    moneda,
    kpis,
    tendencia,
    top_deudores,
  };
}
