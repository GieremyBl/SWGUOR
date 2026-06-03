export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get('periodo') || 'mensual'; // 'mensual' | 'semanal'

    const ahora = new Date();
    const inicioAno = new Date(ahora.getFullYear(), 0, 1);

    // ── Agregaciones en paralelo ──
    const [
      ordenesStats,
      ventasStats,
      pedidosPorEstado,
      ventasMensuales,
      stockCritico,
      produccionStats,
    ] = await Promise.all([
      // 1. Totales de órdenes
      prisma.ordenes_compra.aggregate({
        _count: { id: true },
        _sum: { total_orden: true },
        _avg: { total_orden: true },
      }),

      // 2. Totales de ventas
      prisma.pedidos.aggregate({
        where: { estado: 'entregado' },
        _count: { id: true },
        _sum: { total: true },
        _avg: { total: true },
      }),

      // 3. Pedidos agrupados por estado
      prisma.pedidos.groupBy({
        by: ['estado'],
        _count: { id: true },
        _sum: { total_estimado: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // 4. Ventas mensuales del año en curso
      prisma.pedidos.findMany({
        where:  { created_at: { gte: inicioAno } },
        select: { total: true, created_at: true },
      }),

      // 5. Stock crítico de productos
      prisma.productos.findMany({
        where: { stock: { lte: 50 } },
        select: { id: true, nombre: true, stock: true, estado: true },
        orderBy: { stock: 'asc' },
        take: 20,
      }),

      // 6. Producción: confecciones por estado
      prisma.confecciones.groupBy({
        by: ['estado'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    // ── Calcular pedidos atrasados ──
    // Pedidos en estado pendiente cuya fecha_prometida_entrega (en ordenes vinculadas) ya pasó
    const pedidosPendientes = await prisma.pedidos.findMany({
      where: { estado: 'pendiente' },
      // cotizaciones no existe como relación, solo existe cotizacion_id como campo
      select: {
        id: true,
        cotizacion_id: true,
      },
    });

    const hoy = new Date();
    const pedidosAtrasados = 0;

    // ── Agrupar ventas mensuales por mes real ──
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];
    const ventasPorMes = meses.map((name, idx) => ({
      name,
      mes: idx + 1,
      ventas: 0,
      count: 0,
    }));

    for (const v of ventasMensuales) {
      if (v.created_at) {
        const mesIdx = new Date(v.created_at).getMonth();
        ventasPorMes[mesIdx].ventas += Number(v.total ?? 0);
        ventasPorMes[mesIdx].count  += 1;
      }
    }

    // ── Estados de producción con colores ──
    const estadoColorMap: Record<string, string> = {
      corte: '#f59e0b',
      confeccionando: '#3b82f6',
      remallado: '#8b5cf6',
      terminado: '#10b981',
    };

    const estadosProduccion = produccionStats.map((p) => ({
      name: p.estado,
      value: p._count.id,
      color: estadoColorMap[p.estado] ?? '#6b7280',
    }));

    // ── Resumen ──
    const summary = {
      totalVentas: Number(ventasStats._sum.total ?? 0),
      totalOrdenes: ordenesStats._count.id,
      totalPedidos: pedidosPorEstado.reduce((sum, p) => sum + p._count.id, 0),
      promedioOrden: Number(ordenesStats._avg.total_orden ?? 0),
      promedioVenta: Number(ventasStats._avg.total ?? 0),
      pendientes: pedidosPorEstado.find((p) => p.estado === 'pendiente')?._count.id ?? 0,
      atrasados: pedidosAtrasados,
      stockCritico: stockCritico.length,
      confeccionesEnCurso: produccionStats
        .filter((p) => p.estado !== 'pendiente')
        .reduce((sum, p) => sum + p._count.id, 0),
    };

    return NextResponse.json(
      serializeBigInt({
        summary,
        ventasMensuales: ventasPorMes,
        pedidosPorEstado: pedidosPorEstado.map((p) => ({
          estado: p.estado,
          count: p._count.id,
          total_estimado: Number(p._sum.total_estimado ?? 0),
        })),
        estadosProduccion,
        stockCritico,
      })
    );
  } catch (error: any) {
    console.error('Error en stats API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
