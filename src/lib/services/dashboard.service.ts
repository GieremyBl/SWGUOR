import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

export interface VentaResumen {
  id: string;
  cliente: string;
  monto: number;
  fecha: string;
  estado: string;
}

export interface VentaMensual {
  mes:    string;
  ventas: number; // renombrado de "total" a "ventas" para que el AreaChart (dataKey="ventas") funcione
}

export interface TopProducto {
  nombre:   string;
  cantidad: number;
}

export interface DashboardKpis {
  total_ventas:       number;
  total_pedidos:      number;
  total_clientes:     number;
  ticket_promedio:    number;
  crecimiento_ventas: number;
  stock_alerta:       number;
  total_insumos?:     number;
  // Compatibilidad
  nuevas_ordenes?:    number;
  facturacion?:       number;
  clientesB2B?:       number;
  pedidosActivos?:    number;
  cotizacionesPend?:  number;
}

export const DashboardService = {

  async getDashboardData(role: string, days: number = 30) {
    const data: any = {
      kpis:            await this.getKpis(days),
      recentOrders:    await this.getRecentOrders(5),      // antes: recentSales
      ventasMensuales: await this.getMonthlySales(),       // antes: monthlySales, ahora nombre correcto
      criticalStock:   await this.getCriticalStock(10),
      topProductos:    await this.getTopProductos(5),      // ← NUEVO
    };

    if (role === 'almacenero') {
      data.almacen = await this.getAlmaceneroMetrics();
    } else if (role === 'disenador') {
      data.diseno = await this.getDisenadorMetrics();
    } else if (role === 'cortador') {
      data.corte = await this.getCortadorMetrics();
    } else if (role === 'recepcionista') {
      data.recepcion = await this.getRecepcionistaMetrics();
    }

    return serializeBigInt(data);
  },

  async getKpis(days: number): Promise<DashboardKpis> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalVentas, totalPedidos, totalClientes, stockAlerta, totalInsumos] = await Promise.all([
      prisma.pedidos.aggregate({
        _sum:  { total: true },
        where: { created_at: { gte: startDate }, estado: { not: 'cancelado' } },
      }),
      prisma.pedidos.count({ where: { created_at: { gte: startDate } } }),
      prisma.clientes.count({ where: { activo: 'activo' } }),
      prisma.insumo.count({
        where: { stock_actual: { lte: prisma.insumo.fields.stock_minimo } },
      }),
      prisma.insumo.count(),
    ]);

    const totalVentasValue = Number(totalVentas._sum?.total || 0);

    return {
      total_ventas:       totalVentasValue,
      total_pedidos:      totalPedidos,
      total_clientes:     totalClientes,
      ticket_promedio:    totalPedidos > 0 ? totalVentasValue / totalPedidos : 0,
      crecimiento_ventas: 12.5,
      stock_alerta:       stockAlerta,
      total_insumos:      totalInsumos,
      nuevas_ordenes:     totalPedidos,
      facturacion:        totalVentasValue,
      clientesB2B:        totalClientes,
      pedidosActivos:     totalPedidos,
      cotizacionesPend:   0,
    };
  },

  // ── NUEVO: Top productos más pedidos ────────────────────────────────────────
  async getTopProductos(limit: number): Promise<TopProducto[]> {
    // Agrupa detalles de pedidos por producto y suma cantidades
    const resultados = await prisma.pedido_items.groupBy({
      by:      ['producto_id'],
      _sum:    { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take:    limit,
    });

    if (resultados.length === 0) return [];

    // Obtener nombres de los productos
    const ids = resultados.map((r) => r.producto_id).filter(Boolean) as bigint[];
    const productos = await prisma.productos.findMany({
      where:  { id: { in: ids } },
      select: { id: true, nombre: true },
    });

    const nombreMap = new Map(productos.map((p) => [p.id.toString(), p.nombre]));

    return resultados.map((r) => ({
      nombre:   nombreMap.get(r.producto_id?.toString() ?? '') ?? 'Producto desconocido',
      cantidad: Number(r._sum.cantidad ?? 0),
    }));
  },

  // ── Órdenes recientes (antes getRecentSales) ─────────────────────────────────
  async getRecentOrders(limit: number) {
    const orders = await prisma.pedidos.findMany({
      take:    limit,
      orderBy: { created_at: 'desc' },
      include: { clientes: { select: { razon_social: true } } },
    });
    return orders;   // se devuelve el objeto completo para que el dashboard acceda a o.clientes
  },

  async getMonthlySales(): Promise<VentaMensual[]> {
    // Calcula ventas reales de los últimos 6 meses agrupadas por mes
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const pedidos = await prisma.pedidos.findMany({
      where: {
        created_at: { gte: sixMonthsAgo },
        estado:     { not: 'cancelado' },
      },
      select: { created_at: true, total: true },
    });

    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const mapa  = new Map<string, number>();

    pedidos.forEach((p) => {
      const key = meses[p.created_at!.getMonth()];
      mapa.set(key, (mapa.get(key) ?? 0) + Number(p.total ?? 0));
    });

    // Generar array ordenado de los últimos 6 meses
    return Array.from({ length: 6 }, (_, i) => {
      const d   = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = meses[d.getMonth()];
      return { mes: key, ventas: mapa.get(key) ?? 0 };
    });
  },

  async getCriticalStock(limit: number) {
    const items = await prisma.insumo.findMany({
      where:   { stock_actual: { lte: prisma.insumo.fields.stock_minimo } },
      take:    limit,
      orderBy: { stock_actual: 'asc' },
    });
    return items.map((i) => ({
      id:      i.id.toString(),
      nombre:  i.nombre,
      stock:   Number(i.stock_actual),
      minimo:  Number(i.stock_minimo),
      stock_actual:  i.stock_actual,
      unidad_medida: i.unidad_medida,
    }));
  },

  async getAlmaceneroMetrics() {
    const [movimientos, ordenesCompra] = await Promise.all([
      prisma.movimientos_inventario.findMany({
        take:    5,
        orderBy: { created_at: 'desc' },
        include: { insumo: true, materiales: true, usuarios: true },
      }),
      prisma.ordenes_compra.findMany({
        where:   { estado: 'pendiente' },
        take:    5,
        include: { proveedores: true },
      }),
    ]);
    return {
      movimientos: movimientos.map((m) => ({
        id:   m.id.toString(),
        item: m.insumo?.nombre || m.materiales?.nombre || 'Item desconocido',
        qty:  `${(m.cantidad || 0) > 0 ? '+' : ''}${m.cantidad}`,
        date: m.created_at.toISOString(),
        user: m.usuarios?.email || 'Sistema',
        type: (m.cantidad || 0) > 0 ? 'entrada' : 'salida',
      })),
      ordenes_pendientes: ordenesCompra.length,
    };
  },

  async getDisenadorMetrics() {
    const [diseños, fichas] = await Promise.all([
      prisma.productos.count({ where: { estado: 'activo' } }),
      prisma.fichas_tecnicas.findMany({
        take:    5,
        orderBy: { created_at: 'desc' },
        include: { productos: true },
      }),
    ]);
    return {
      fichas_recientes: fichas.map((f) => ({
        id:      f.id.toString(),
        prenda:  f.productos?.nombre || 'Sin producto',
        version: f.version,
        estado:  f.estado,
        fecha:   f.created_at.toISOString(),
      })),
      total_diseños: diseños,
    };
  },

  async getCortadorMetrics() {
    const ordenes = await prisma.ordenes_produccion.findMany({
      where:   { estado: 'confirmada' },
      take:    10,
      include: { productos: true },
    });
    return {
      cola_trabajo: ordenes.map((o) => ({
        id:       o.id.toString(),
        prenda:   o.productos?.nombre || 'Desconocido',
        lotes:    o.cantidad_solicitada,
        estado:   o.estado,
        prioridad: 'normal',
      })),
    };
  },

  async getRecepcionistaMetrics() {
    const [cotizaciones, pedidosHoy] = await Promise.all([
      prisma.cotizaciones.findMany({
        take:    5,
        orderBy: { created_at: 'desc' },
        include: { cliente: true },
      }),
      prisma.pedidos.count({
        where: { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);
    return {
      cotizaciones_recientes: cotizaciones.map((c) => ({
        id:      c.id.toString(),
        cliente: c.cliente?.razon_social || 'Cliente Varios',
        total:   Number(c.total || 0),
        estado:  c.estado,
      })),
      pedidos_hoy: pedidosHoy,
    };
  },
};