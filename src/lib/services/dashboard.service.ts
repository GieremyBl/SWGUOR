import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface VentaMensual {
  mes: string;
  ventas: number;
}

export interface TopProducto {
  nombre: string;
  cantidad: number;
}

export interface DashboardKpis {
  total_ventas: number;
  total_pedidos: number;
  total_clientes: number;
  ticket_promedio: number;
  crecimiento_ventas: number;
  stock_alerta: number;
  total_insumos: number;
  nuevas_ordenes: number;
  facturacion: number;
  clientesB2B: number;
  pedidosActivos: number;
  cotizacionesPend: number;
}

export interface CriticalStockItem {
  id: string;
  nombre: string;
  stock: number;
  minimo: number;
  stock_actual: number | { toNumber(): number };
  unidad_medida: string;
}

export interface MovimientoAlmacen {
  id: string;
  item: string;
  qty: string;
  date: string;
  user: string;
  type: 'entrada' | 'salida';
}

export interface AlmacenMetrics {
  movimientos: MovimientoAlmacen[];
  ordenes_pendientes: number;
}

export interface FichaReciente {
  id: string;
  prenda: string;
  version: string | null;
  estado: string | null;
  fecha: string;
}

export interface DisenadorMetrics {
  fichas_recientes: FichaReciente[];
  total_diseños: number;
}

export interface OrdenCola {
  id: string;
  prenda: string;
  lotes: number;
  estado: string;
  prioridad: string;
  deadline: string;
  taller: string;
}

export interface CortadorMetrics {
  cola_trabajo: OrdenCola[];
}

export interface CotizacionReciente {
  id: string;
  cliente: string;
  total: number;
  estado: string;
}

export interface RecepcionistaMetrics {
  cotizaciones_recientes: CotizacionReciente[];
  pedidos_hoy: number;
}

export interface LoteExterno {
  id: string;
  taller: string;
  servicio: string;
  estado: string;
  entrega: string;
  avance: number;
}

export interface RepresentanteMetrics {
  lotes_externos: LoteExterno[];
  retrasados: number;
  ruta_hoy: { id: string; numero: string; tipo: string; destino: string }[];
  lead_time_dias: number;
}

export interface AyudanteMetrics {
  guias_hoy: { id: string; numero: string; tipo: string; destino: string }[];
  pedidos_listo_despacho: number;
  incidencias_abiertas: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const DashboardService = {

  async getDashboardData(role: string, days = 30) {
    const data: Record<string, unknown> = {
      kpis: await this.getKpis(days),
      recentOrders: await this.getRecentOrders(5),
      ventasMensuales: await this.getMonthlySales(),
      criticalStock: await this.getCriticalStock(10),
      topProductos: await this.getTopProductos(5),
    };

    switch (role) {
      case 'almacenero':
        data.almacen = await this.getAlmaceneroMetrics();
        break;
      case 'disenador':
        data.diseno = await this.getDisenadorMetrics();
        break;
      case 'cortador':
        data.corte = await this.getCortadorMetrics();
        break;
      case 'recepcionista':
        data.recepcion = await this.getRecepcionistaMetrics();
        break;
      case 'representante_taller':
        data.representante = await this.getRepresentanteMetrics();
        break;
      case 'ayudante':
        data.ayudante = await this.getAyudanteMetrics();
        break;
    }

    return serializeBigInt(data);
  },

  // ── KPIs globales ─────────────────────────────────────────────────────────

  async getKpis(days: number): Promise<DashboardKpis> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const [
      totalVentas,
      totalPedidos,
      totalClientesCount,
      stockAlertaResult,
      totalInsumosResult,
      cotizacionesPendCount,
    ] = await Promise.all([
      // 1. Suma de ventas
      prisma.pedidos.aggregate({
        _sum: { total: true },
        where: { created_at: { gte: startDate }, estado: { not: 'cancelado' } },
      }),
      // 2. Conteo de pedidos
      prisma.pedidos.count({ where: { created_at: { gte: startDate } } }),
      // 3. Clientes activos (Conteo directo por ORM para evitar un queryRaw redundante)
      prisma.clientes.count({ where: { estado: 'activo' } }),
      // 4. Conteo de insumos en stock crítico bajo stock_minimo
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM public.insumo
        WHERE alerta_bajo_stock = true
          AND stock_actual <= stock_minimo
      `,
      // 5. Total de insumos registrados con alertas activas
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM public.insumo
        WHERE alerta_bajo_stock = true
      `,
      // 6. Cotizaciones pendientes enviadas
      prisma.cotizaciones.count({ where: { estado: 'enviada' } }),
    ]);

    const stockAlerta = Number(stockAlertaResult[0]?.count ?? 0);
    const totalInsumos = Number(totalInsumosResult[0]?.count ?? 0);
    const totalV = Number(totalVentas._sum?.total ?? 0);

    return {
      total_ventas: totalV,
      total_pedidos: totalPedidos,
      total_clientes: totalClientesCount,
      ticket_promedio: totalPedidos > 0 ? totalV / totalPedidos : 0,
      crecimiento_ventas: 12.5,
      stock_alerta: stockAlerta,
      total_insumos: totalInsumos,
      nuevas_ordenes: totalPedidos,
      facturacion: totalV,
      clientesB2B: totalClientesCount,
      pedidosActivos: totalPedidos,
      cotizacionesPend: cotizacionesPendCount,
    };
  },

  // ── Top productos ─────────────────────────────────────────────────────────

  async getTopProductos(limit: number): Promise<TopProducto[]> {
    const resultados = await prisma.pedido_items.groupBy({
      by: ['producto_id'],
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: limit,
    });

    if (resultados.length === 0) return [];

    const ids = resultados
      .map((r) => r.producto_id)
      .filter((id): id is bigint => id !== null);

    const productos = await prisma.productos.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true },
    });

    const nombreMap = new Map(productos.map((p) => [p.id.toString(), p.nombre]));

    return resultados.map((r) => ({
      nombre: nombreMap.get(r.producto_id?.toString() ?? '') ?? 'Producto desconocido',
      cantidad: Number(r._sum.cantidad ?? 0),
    }));
  },

  // ── Pedidos recientes ─────────────────────────────────────────────────────

  async getRecentOrders(limit: number) {
    return prisma.pedidos.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { clientes: { select: { razon_social: true } } },
    });
  },

  // ── Ventas mensuales ──────────────────────────────────────────────────────

  async getMonthlySales(): Promise<VentaMensual[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const pedidos = await prisma.pedidos.findMany({
      where: { created_at: { gte: sixMonthsAgo }, estado: { not: 'cancelado' } },
      select: { created_at: true, total: true },
    });

    const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mapa = new Map<string, number>();

    for (const p of pedidos) {
      if (p.created_at) {
        const key = MESES[p.created_at.getMonth()];
        mapa.set(key, (mapa.get(key) ?? 0) + Number(p.total ?? 0));
      }
    }

    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = MESES[d.getMonth()];
      return { mes: key, ventas: mapa.get(key) ?? 0 };
    });
  },

  // ── Stock crítico ─────────────────────────────────────────────────────────

  async getCriticalStock(limit: number): Promise<CriticalStockItem[]> {
    const criticos = await prisma.$queryRaw<{ id: bigint }[]>`
      SELECT id
      FROM   public.insumo
      WHERE  alerta_bajo_stock = true
        AND  stock_actual <= stock_minimo
      ORDER  BY stock_actual ASC
      LIMIT  ${limit}
    `;

    if (criticos.length === 0) return [];

    const ids = criticos.map((r) => r.id);
    const items = await prisma.insumo.findMany({
      where: { id: { in: ids } },
      orderBy: { stock_actual: 'asc' },
    });

    return items.map((i) => ({
      id: i.id.toString(),
      nombre: i.nombre,
      stock: Number(i.stock_actual),
      minimo: Number(i.stock_minimo),
      stock_actual: i.stock_actual,
      unidad_medida: i.unidad_medida,
    }));
  },

  // ── Almacenero ────────────────────────────────────────────────────────────

  async getAlmaceneroMetrics(): Promise<AlmacenMetrics> {
    const [movimientos, ordenesPendientes] = await Promise.all([
      prisma.movimientos_inventario.findMany({
        take: 15,
        orderBy: { created_at: 'desc' },
        include: { insumo: true, materiales: true, usuarios: true },
      }),
      prisma.ordenes_compra.count({ where: { estado: 'pendiente' } }),
    ]);

    return {
      movimientos: movimientos.map((m) => ({
        id: m.id.toString(),
        item: m.insumo?.nombre ?? m.materiales?.nombre ?? 'Item desconocido',
        qty: `${Number(m.cantidad ?? 0) >= 0 ? '+' : ''}${m.cantidad}`,
        date: m.created_at.toISOString(),
        user: m.usuarios?.email ?? 'Sistema',
        type: Number(m.cantidad ?? 0) >= 0 ? 'entrada' : 'salida',
      })),
      ordenes_pendientes: ordenesPendientes,
    };
  },

  // ── Diseñador ─────────────────────────────────────────────────────────────

  async getDisenadorMetrics(): Promise<DisenadorMetrics> {
    const [diseños, fichas] = await Promise.all([
      prisma.productos.count({ where: { estado: 'activo' } }),
      prisma.fichas_tecnicas.findMany({
        take: 6,
        orderBy: { created_at: 'desc' },
        include: { productos: true },
      }),
    ]);

    return {
      fichas_recientes: fichas.map((f) => ({
        id: f.id.toString(),
        prenda: f.productos?.nombre ?? 'Sin producto',
        version: f.version,
        estado: f.estado,
        fecha: f.created_at.toISOString(),
      })),
      total_diseños: diseños,
    };
  },

  // ── Cortador ──────────────────────────────────────────────────────────────

  async getCortadorMetrics(): Promise<CortadorMetrics> {
    const ordenes = await prisma.ordenes_produccion.findMany({
      where: { estado: { in: ['confirmada', 'en_produccion'] } },
      take: 15,
      orderBy: [{ estado: 'asc' }, { fecha_entrega: 'asc' }],
      include: {
        productos: { select: { nombre: true } },
        talleres: { select: { nombre: true } },
      },
    });

    return {
      cola_trabajo: ordenes.map((o) => ({
        id: o.id.toString(),
        prenda: o.productos?.nombre ?? 'Desconocido',
        lotes: o.cantidad_solicitada,
        estado: o.estado,
        prioridad: 'normal',
        deadline: o.fecha_entrega
          ? new Date(o.fecha_entrega).toLocaleDateString('es-PE', {
            day: '2-digit', month: 'short',
          })
          : 'Sin fecha',
        taller: o.talleres?.nombre ?? '—',
      })),
    };
  },

  // ── Recepcionista ─────────────────────────────────────────────────────────

  async getRecepcionistaMetrics(): Promise<RecepcionistaMetrics> {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const [cotizaciones, pedidosHoy] = await Promise.all([
      prisma.cotizaciones.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        where: { estado: { not: 'rechazada' } },
        include: { cliente: { select: { razon_social: true } } },
      }),
      prisma.pedidos.count({ where: { created_at: { gte: inicioHoy } } }),
    ]);

    return {
      cotizaciones_recientes: cotizaciones.map((c) => ({
        id: c.id.toString(),
        cliente: c.cliente?.razon_social ?? 'Cliente Varios',
        total: Number(c.total ?? 0),
        estado: c.estado ?? 'borrador',
      })),
      pedidos_hoy: pedidosHoy,
    };
  },

  // ── Representante de Taller ───────────────────────────────────────────────

  async getRepresentanteMetrics(): Promise<RepresentanteMetrics> {
    const ETAPAS = [
      'diseno', 'patronaje', 'corte', 'confeccion', 'remallado',
      'bordado_estampado', 'control_calidad', 'acabado', 'listo_entrega',
    ] as const;

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const [lotes, retrasados, rutaHoy, leadTimeResult] = await Promise.all([
      prisma.ordenes_produccion.findMany({
        where: { estado: { in: ['confirmada', 'en_produccion'] } },
        take: 10,
        orderBy: { fecha_entrega: 'asc' },
        include: {
          productos: { select: { nombre: true } },
          talleres: { select: { nombre: true } },
          seguimiento_produccion: {
            orderBy: { created_at: 'desc' },
            take: 1,
            select: { etapa: true },
          },
        },
      }),
      prisma.ordenes_produccion.count({
        where: {
          estado: { notIn: ['completada', 'cancelada'] },
          fecha_entrega: { lt: new Date() },
        },
      }),
      prisma.guias_remision.findMany({
        where: {
          fecha_traslado: inicioHoy,
          tipo: { in: ['retorno_taller', 'envio_taller'] },
          estado: { not: 'anulada' },
        },
        select: { id: true, numero: true, tipo: true, destino_direccion: true },
        take: 5,
      }),
      prisma.$queryRaw<{ avg_dias: number | null }[]>`
        SELECT ROUND(
          AVG(EXTRACT(EPOCH FROM (completado_en - iniciado_en)) / 86400)::numeric, 1
        ) AS avg_dias
        FROM public.seguimiento_produccion
        WHERE etapa        = 'listo_entrega'
          AND completado_en IS NOT NULL
          AND iniciado_en  >= NOW() - INTERVAL '30 days'
      `,
    ]);

    const leadTime = Number(
      (leadTimeResult as { avg_dias: number | null }[])[0]?.avg_dias ?? 4.2
    );

    return {
      lotes_externos: lotes.map((o) => {
        const etapa = o.seguimiento_produccion[0]?.etapa ?? 'corte';
        const idx = ETAPAS.indexOf(etapa as typeof ETAPAS[number]);
        const avance = Math.round(((idx + 1) / ETAPAS.length) * 100);
        const retraso = o.fecha_entrega && new Date(o.fecha_entrega) < new Date();

        return {
          id: o.id.toString(),
          taller: o.talleres?.nombre ?? '—',
          servicio: etapa.replace(/_/g, ' '),
          estado: retraso ? 'Retrasado' : o.estado === 'en_produccion' ? 'En Proceso' : 'Confirmado',
          entrega: o.fecha_entrega
            ? new Date(o.fecha_entrega).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
            : 'Sin fecha',
          avance,
        };
      }),
      retrasados,
      ruta_hoy: rutaHoy.map((g) => ({
        id: g.id.toString(),
        numero: g.numero,
        tipo: g.tipo.replace(/_/g, ' '),
        destino: g.destino_direccion,
      })),
      lead_time_dias: leadTime,
    };
  },

  // ── Ayudante ──────────────────────────────────────────────────────────────

  async getAyudanteMetrics(): Promise<AyudanteMetrics> {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const [guias, pedidosListos, incidencias] = await Promise.all([
      prisma.guias_remision.findMany({
        where: { fecha_traslado: inicioHoy, estado: { not: 'anulada' } },
        select: { id: true, numero: true, tipo: true, destino_direccion: true },
        take: 5,
      }),
      prisma.pedidos.count({ where: { estado: 'listo_para_despacho' } }),
      prisma.incidencias_taller.count({ where: { resuelto: false } }),
    ]);

    return {
      guias_hoy: guias.map((g) => ({
        id: g.id.toString(),
        numero: g.numero,
        tipo: g.tipo.replace(/_/g, ' '),
        destino: g.destino_direccion,
      })),
      pedidos_listo_despacho: pedidosListos,
      incidencias_abiertas: incidencias,
    };
  },
};