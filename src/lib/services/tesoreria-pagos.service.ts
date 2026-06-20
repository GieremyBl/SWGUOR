import type { MetodoPago, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  mapEstadoPagoATesoreria,
  mapEstadoTesoreriaFiltroAPrisma,
  type EstadoTesoreriaFiltro,
} from '@/lib/constants/tesoreria-pagos';
import type {
  TesoreriaPagoFila,
  TesoreriaPagosQuery,
  TesoreriaPagosStats,
} from '@/lib/schemas/tesoreria-pagos';

function parseFechaFiltro(value?: string, finDeDia = false): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  if (finDeDia) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}

function buildBusquedaWhere(busqueda?: string): Prisma.pagosWhereInput | undefined {
  const q = busqueda?.trim();
  if (!q) return undefined;

  return {
    OR: [
      {
        pedidos: {
          clientes: {
            OR: [
              { razon_social: { contains: q, mode: 'insensitive' } },
              { nombre_comercial: { contains: q, mode: 'insensitive' } },
              { ruc: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      },
      {
        comprobantes: {
          some: {
            OR: [
              { numero_completo: { contains: q, mode: 'insensitive' } },
              { serie: { contains: q, mode: 'insensitive' } },
              { correlativo: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      },
      ...(Number.isFinite(Number(q)) ? [{ pedido_id: BigInt(q) }] : []),
    ],
  };
}

function buildWhere(filtros: TesoreriaPagosQuery): Prisma.pagosWhereInput {
  const where: Prisma.pagosWhereInput = {};

  const estadosPrisma = mapEstadoTesoreriaFiltroAPrisma(
    filtros.estado as EstadoTesoreriaFiltro,
  );
  if (estadosPrisma?.length) {
    where.estado = { in: estadosPrisma };
  }

  if (filtros.metodo_pago && filtros.metodo_pago !== 'todos') {
    where.metodo_pago = filtros.metodo_pago as MetodoPago;
  }

  const desde = parseFechaFiltro(filtros.fecha_desde);
  const hasta = parseFechaFiltro(filtros.fecha_hasta, true);
  if (desde || hasta) {
    where.fecha_pago = {
      ...(desde ? { gte: desde } : {}),
      ...(hasta ? { lte: hasta } : {}),
    };
  }

  const busquedaWhere = buildBusquedaWhere(filtros.busqueda);
  if (busquedaWhere) {
    where.AND = [busquedaWhere];
  }

  return where;
}

type PagoConRelaciones = Awaited<ReturnType<typeof fetchPagosRows>>[number];

function mapPagoRow(pago: PagoConRelaciones): TesoreriaPagoFila {
  const pedido = pago.pedidos;
  const cliente = pedido?.clientes ?? null;
  const comprobante = pago.comprobantes[0] ?? null;

  return {
    id_uuid: pago.id_uuid,
    pedido_id: Number(pago.pedido_id),
    monto: Number(pago.monto ?? 0),
    metodo_pago: pago.metodo_pago,
    tipo: pago.tipo,
    estado: pago.estado,
    estado_tesoreria: mapEstadoPagoATesoreria(pago.estado),
    fecha_pago: pago.fecha_pago.toISOString(),
    notas: pago.notas,
    verificado_at: pago.verificado_at?.toISOString() ?? null,
    cliente: cliente
      ? {
          id: Number(cliente.id),
          razon_social: cliente.razon_social,
          nombre_comercial: cliente.nombre_comercial,
          ruc: cliente.ruc,
        }
      : null,
    pedido: {
      id: Number(pedido?.id ?? pago.pedido_id),
      estado: pedido?.estado ?? null,
      total: Number(pedido?.total ?? 0),
      monto_pagado: Number(pedido?.monto_pagado ?? 0),
      saldo_pendiente: Number(pedido?.saldo_pendiente ?? 0),
    },
    comprobante: comprobante
      ? {
          id: comprobante.id_uuid,
          numero_completo: comprobante.numero_completo,
          serie: comprobante.serie,
          correlativo: comprobante.correlativo,
          tipo: comprobante.tipo,
          estado_sunat: comprobante.estado_sunat,
        }
      : null,
  };
}

async function fetchPagosRows(where: Prisma.pagosWhereInput, skip: number, take: number) {
  return prisma.pagos.findMany({
    where,
    skip,
    take,
    orderBy: { fecha_pago: 'desc' },
    include: {
      pedidos: {
        select: {
          id: true,
          estado: true,
          total: true,
          monto_pagado: true,
          saldo_pendiente: true,
          clientes: {
            select: {
              id: true,
              razon_social: true,
              nombre_comercial: true,
              ruc: true,
            },
          },
        },
      },
      comprobantes: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: {
          id_uuid: true,
          numero_completo: true,
          serie: true,
          correlativo: true,
          tipo: true,
          estado_sunat: true,
        },
      },
    },
  });
}

async function calcularStats(where: Prisma.pagosWhereInput): Promise<TesoreriaPagosStats> {
  const [total, exitosos, pendientes, fallidos, montoExitosoAgg] = await Promise.all([
    prisma.pagos.count({ where }),
    prisma.pagos.count({ where: { ...where, estado: { in: ['pagado', 'pago_parcial'] } } }),
    prisma.pagos.count({ where: { ...where, estado: 'pendiente' } }),
    prisma.pagos.count({ where: { ...where, estado: 'anulado' } }),
    prisma.pagos.aggregate({
      where: { ...where, estado: { in: ['pagado', 'pago_parcial'] } },
      _sum: { monto: true },
    }),
  ]);

  return {
    total,
    exitosos,
    pendientes,
    fallidos,
    monto_exitoso: Number(montoExitosoAgg._sum.monto ?? 0),
  };
}

export async function listarPagosTesoreria(filtros: TesoreriaPagosQuery) {
  const where = buildWhere(filtros);
  const page = filtros.page;
  const limit = filtros.limit;
  const skip = (page - 1) * limit;

  const [total, rows, stats] = await Promise.all([
    prisma.pagos.count({ where }),
    fetchPagosRows(where, skip, limit),
    calcularStats(where),
  ]);

  return {
    data: rows.map(mapPagoRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    stats,
  };
}
