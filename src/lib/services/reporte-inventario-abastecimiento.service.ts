import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { REPORTE_INVENTARIO_FILTRO_TODOS } from '@/lib/constants/reporte-inventario';
import {
  calcularDeficit,
  calcularOcupacionAlmacen,
  calcularPorcentajeStock,
  calcularValorizacion,
  estaBajoStockMinimo,
  ordenarAlertasPorUrgencia,
  resolverStockMaximo,
  resolverStockMinimo,
} from '@/lib/helpers/reporte-inventario.helper';
import type {
  ReporteInventarioAbastecimientoResponse,
  ReporteInventarioAlerta,
  ReporteInventarioKpis,
  ReporteInventarioOcupacionAlmacen,
  ReporteInventarioQuery,
} from '@/lib/schemas/reporte-inventario-abastecimiento';

type StockRow = Awaited<ReturnType<typeof fetchStockRows>>[number];

function buildStockWhere(query: ReporteInventarioQuery): Prisma.almacen_stockWhereInput {
  const where: Prisma.almacen_stockWhereInput = {
    OR: [{ insumo_id: { not: null } }, { material_id: { not: null } }],
  };

  if (query.almacen_id !== REPORTE_INVENTARIO_FILTRO_TODOS) {
    where.almacen_id = BigInt(query.almacen_id);
  }

  if (query.categoria_id !== REPORTE_INVENTARIO_FILTRO_TODOS) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { insumo: { categoria_id: query.categoria_id } } as Prisma.almacen_stockWhereInput,
    ];
  }
  return where;
}

function buildMovimientosWhere(query: ReporteInventarioQuery): Prisma.movimientos_inventarioWhereInput {
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const where: Prisma.movimientos_inventarioWhereInput = {
    created_at: { gte: hace24h },
    OR: [{ insumo_id: { not: null } }, { material_id: { not: null } }],
  };

  if (query.almacen_id !== REPORTE_INVENTARIO_FILTRO_TODOS) {
    where.almacen_id = BigInt(query.almacen_id);
  }

  if (query.categoria_id !== REPORTE_INVENTARIO_FILTRO_TODOS) {
    where.insumo = { categoria_id: query.categoria_id };
  }

  return where;
}

async function fetchStockRows(query: ReporteInventarioQuery) {
  return prisma.almacen_stock.findMany({
    where: buildStockWhere(query),
    include: {
      almacenes: {
        select: {
          id: true,
          nombre: true,
          capacidad_total: true,
          unidad_capacidad: true,
        },
      },
      insumo: {
        select: {
          id: true,
          nombre: true,
          stock_minimo: true,
          stock_maximo: true,
          precio_unitario: true,
          categoria_id: true,
          categoria_insumo: {
            select: {
              nombre: true,
            },
          },
        },
      },
      materiales: {
        select: {
          id: true,
          nombre: true,
          stock_minimo: true,
          precio_unitario: true,
        },
      },
    },
  });
}

function mapStockToAlerta(row: StockRow): ReporteInventarioAlerta | null {
  const cantidad = Number(row.cantidad ?? 0);

  if (row.insumo_id && row.insumo) {
    const insumo = row.insumo;

    const stockMinimo = resolverStockMinimo(row.stock_minimo, insumo.stock_minimo);
    if (!estaBajoStockMinimo(cantidad, stockMinimo)) return null;
    const stockMaximo = resolverStockMaximo(insumo.stock_maximo, stockMinimo);

    return {
      stock_id:         Number(row.id),
      tipo:             'insumo',
      item_id:          Number(insumo.id),
      nombre:           insumo.nombre,
      categoria:        insumo.categoria_insumo?.nombre ?? null,
      almacen_id:       Number(row.almacen_id),
      almacen_nombre:   row.almacenes.nombre,
      cantidad,
      stock_minimo:     stockMinimo,
      stock_maximo:     stockMaximo,
      porcentaje_stock: calcularPorcentajeStock(cantidad, stockMaximo),
      deficit:          calcularDeficit(cantidad, stockMinimo),
    };
  }

  if (row.materiales) {
    const stockMinimo = resolverStockMinimo(row.stock_minimo, row.materiales.stock_minimo);
    if (!estaBajoStockMinimo(cantidad, stockMinimo)) return null;

    const stockMaximo = resolverStockMaximo(null, stockMinimo);

    return {
      stock_id:         Number(row.id),
      tipo:             'material',
      item_id:          Number(row.materiales.id),
      nombre:           row.materiales.nombre,
      categoria:        null,
      almacen_id:       Number(row.almacen_id),
      almacen_nombre:   row.almacenes.nombre,
      cantidad,
      stock_minimo:     stockMinimo,
      stock_maximo:     stockMaximo,
      porcentaje_stock: calcularPorcentajeStock(cantidad, stockMaximo),
      deficit:          calcularDeficit(cantidad, stockMinimo),
    };
  }

  return null;
}

function calcularValorizacionDesdeStock(rows: StockRow[]): number {
  return rows.reduce((total, row) => {
    const cantidad = Number(row.cantidad ?? 0);
    if (row.insumo) {
      return total + calcularValorizacion(cantidad, row.insumo.precio_unitario);
    }
    if (row.materiales) {
      return total + calcularValorizacion(cantidad, row.materiales.precio_unitario);
    }
    return total;
  }, 0);
}

async function calcularOcupacionAlmacenes(
  query: ReporteInventarioQuery,
): Promise<ReporteInventarioOcupacionAlmacen[]> {
  const almacenes = await prisma.almacenes.findMany({
    where: {
      estado: true,
      ...(query.almacen_id !== REPORTE_INVENTARIO_FILTRO_TODOS
        ? { id: BigInt(query.almacen_id) }
        : {}),
    },
    select: {
      id: true,
      nombre: true,
      capacidad_total: true,
      unidad_capacidad: true,
      almacen_stock: {
        where: {
          OR: [{ insumo_id: { not: null } }, { material_id: { not: null } }],
          ...(query.categoria_id !== REPORTE_INVENTARIO_FILTRO_TODOS
            ? { insumo: { categoria_id: query.categoria_id } }
            : {}),
        },
        select: { cantidad: true },
      },
    },
    orderBy: { nombre: 'asc' },
  });

  return almacenes.map((almacen) => {
    const ocupacionActual = almacen.almacen_stock.reduce(
      (sum, stock) => sum + Number(stock.cantidad ?? 0),
      0,
    );
    const { capacidadMaxima, porcentaje } = calcularOcupacionAlmacen(
      ocupacionActual,
      almacen.capacidad_total,
    );

    return {
      almacen_id: Number(almacen.id),
      nombre: almacen.nombre,
      ocupacion_actual: ocupacionActual,
      capacidad_maxima: capacidadMaxima,
      porcentaje_ocupacion: porcentaje,
      unidad: almacen.unidad_capacidad ?? 'unidades',
    };
  });
}

async function cargarOpcionesFiltro() {
  const [categorias, almacenes] = await Promise.all([
    prisma.categoria_insumo.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.almacenes.findMany({
      where: { estado: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
  ]);

  return {
    categorias: categorias.map((c) => ({ value: c.id, label: c.nombre })),
    almacenes: almacenes.map((a) => ({ value: Number(a.id), label: a.nombre })),
  };
}

export async function getReporteInventarioAbastecimiento(
  query: ReporteInventarioQuery,
): Promise<ReporteInventarioAbastecimientoResponse> {
  const [stockRows, movimientos24h, ocupacionAlmacenes, filtros] = await Promise.all([
    fetchStockRows(query),
    prisma.movimientos_inventario.count({ where: buildMovimientosWhere(query) }),
    calcularOcupacionAlmacenes(query),
    cargarOpcionesFiltro(),
  ]);

  const alertas = ordenarAlertasPorUrgencia(
    stockRows
      .map(mapStockToAlerta)
      .filter((alerta): alerta is ReporteInventarioAlerta => alerta !== null),
  );

  const almacenTop = [...ocupacionAlmacenes].sort(
    (a, b) => b.porcentaje_ocupacion - a.porcentaje_ocupacion,
  )[0];

  const kpis: ReporteInventarioKpis = {
    articulos_bajo_minimo: alertas.length,
    valorizacion_total: calcularValorizacionDesdeStock(stockRows),
    movimientos_24h: movimientos24h,
    almacen_mayor_ocupacion: almacenTop
      ? {
        id: almacenTop.almacen_id,
        nombre: almacenTop.nombre,
        porcentaje: almacenTop.porcentaje_ocupacion,
      }
      : null,
  };

  return {
    success: true,
    kpis,
    alertas_rojas: alertas,
    ocupacion_almacenes: ocupacionAlmacenes.sort(
      (a, b) => b.porcentaje_ocupacion - a.porcentaje_ocupacion,
    ),
    filtros,
  };
}