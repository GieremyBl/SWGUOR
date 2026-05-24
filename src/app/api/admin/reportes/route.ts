import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '30';
    const days = parseInt(daysParam, 10);

    const fechaLimite = startOfDay(subDays(new Date(), days));

    // ── 1. VENTAS: fuente correcta = pagos verificados ──────────────────────
    // movimientos_inventario no tiene campo `monto` ni `referencia`.
    // La tabla `pagos` sí tiene `monto`, `fecha_pago` y `estado`.
    const pagosVerificados = await prisma.pagos.findMany({
      where: {
        estado: 'verificado',           // enum EstadoPago
        fecha_pago: { gte: fechaLimite },
      },
      select: {
        monto:     true,
        fecha_pago: true,
      },
      orderBy: { fecha_pago: 'asc' },
    });

    const ventasPorDiaMap: Record<string, number> = {};
    let totalVentasPeriodo = 0;

    for (let i = days - 1; i >= 0; i--) {
      const dateStr = subDays(new Date(), i)
        .toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      ventasPorDiaMap[dateStr] = 0;
    }

    pagosVerificados.forEach((pago) => {
      const dateStr = new Date(pago.fecha_pago)
        .toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      const monto = Number(pago.monto ?? 0);
      ventasPorDiaMap[dateStr] = (ventasPorDiaMap[dateStr] ?? 0) + monto;
      totalVentasPeriodo += monto;
    });

    const ventasPorDia = Object.entries(ventasPorDiaMap).map(
      ([fecha, ventas]) => ({ fecha, ventas })
    );

    // ── 2. PEDIDOS ACTIVOS ──────────────────────────────────────────────────
    // El modelo se llama `pedidos`, no `orden`.
    // Los valores del enum EstadoPedido van en minúscula.
    const pedidosActivosContador = await prisma.pedidos.count({
      where: {
        estado: { in: ['pendiente', 'en_produccion', 'listo_para_despacho'] },
      },
    });

    // ── 3. CAPITAL EN PROCESO ───────────────────────────────────────────────
    // movimientos_inventario no tiene relación `ordenProduccion` ni campo `monto`.
    // Aproximación correcta: suma del `total` de pedidos en producción.
    const capitalAgregado = await prisma.pedidos.aggregate({
      where: {
        estado: 'en_produccion',        // enum EstadoPedido
      },
      _sum: {
        total: true,
      },
    });
    const totalCapitalProceso = Number(capitalAgregado._sum.total ?? 0);

    // ── 4. CONCENTRACIÓN DE TALLAS ──────────────────────────────────────────
    // El campo se llama `stock` (Int), no `cantidad`.
    // `talla` es enum TallaProductos (XS | S | M | L | XL | XXL).
    const stockPorTalla = await prisma.variantes_producto.groupBy({
      by: ['talla'],
      where: {
        stock: { gt: 0 },
        estado: 'activo',               // enum EstadoProducto
      },
      _sum: {
        stock: true,
      },
      orderBy: {
        talla: 'asc',
      },
    });

    const concentracionTallas = stockPorTalla.map((item) => ({
      name:  item.talla,
      value: item._sum.stock ?? 0,
    }));

    // ── 5. VENTAS POR CATEGORÍA ─────────────────────────────────────────────
    // No existe `lineaProducto`. La jerarquía correcta es:
    // pedidos → pedido_items → productos → categorias
    const pedidosConItems = await prisma.pedidos.findMany({
      where: {
        created_at: { gte: fechaLimite },
        estado:     { not: 'cancelado' },
      },
      select: {
        pedido_items: {
          select: {
            cantidad: true,
            productos: {
              select: {
                precio: true,
                categorias: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });

    const ventasPorCategoriaMap: Record<string, number> = {};

    pedidosConItems.forEach((pedido) => {
      pedido.pedido_items.forEach((item) => {
        const categoria = item.productos.categorias?.nombre ?? 'Sin categoría';
        // precio unitario × cantidad como aproximación de ingreso por línea
        const monto = item.cantidad * Number(item.productos.precio ?? 0);
        ventasPorCategoriaMap[categoria] =
          (ventasPorCategoriaMap[categoria] ?? 0) + monto;
      });
    });

    const ventasPorCategoria = Object.entries(ventasPorCategoriaMap)
      .map(([name, value]) => ({ name, value }))
      .filter((cat) => cat.value > 0);

    // ── Respuesta unificada ─────────────────────────────────────────────────
    return NextResponse.json({
      metrics: {
        total:             totalVentasPeriodo,
        pedidos:           pedidosActivosContador,
        produccionEnCurso: totalCapitalProceso,
      },
      ventasPorDia,
      concentracionTallas,
      ventasPorCategoria,
    });

  } catch (error) {
    console.error('Error base de datos reportes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}