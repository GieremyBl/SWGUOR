import { prisma } from '@/lib/prisma';
import { Prisma, EstadoOrdenCompra, EstadoPagoOrdenCompra } from '@prisma/client';
import {
  ESTADOS_COTIZACION_PARA_GENERAR_OC,
} from '@/lib/constants/estados';
import { generarYAlmacenarPdfOrdenCompra } from '@/lib/services/orden-compra-documento.service';
import type {
  CrearOrdenCompra,
  CrearOrdenDesdeCotizacion,
  ActualizarOrdenCompra,
  OrdenCompraItemInput,
} from '@/lib/schemas/ordenes-compra';
import {
  ORDEN_COMPRA_INCLUDE,
  type OrdenCompraDetalle,
} from '@/lib/services/ordenes-compra.types';

export type { OrdenCompraDetalle };

export interface FiltrosOrdenCompra {
  proveedor_id?: number | bigint;
  estado?: EstadoOrdenCompra;
  estado_pago?: EstadoPagoOrdenCompra;
  cotizacion_proveedor_id?: number | bigint;
}

function calcularTotalItems(items: OrdenCompraItemInput[]): number {
  return items.reduce(
    (acc, item) => acc + item.cantidad_pedida * item.precio_unitario,
    0,
  );
}

function mapItemsCreate(
  ordenId: bigint,
  items: OrdenCompraItemInput[],
): Prisma.ordenes_compra_itemsCreateManyInput[] {
  return items.map((item) => ({
    orden_compra_id: ordenId,
    material_id: item.material_id != null ? BigInt(item.material_id) : null,
    insumo_id: item.insumo_id != null ? BigInt(item.insumo_id) : null,
    cantidad_pedida: item.cantidad_pedida,
    precio_unitario: item.precio_unitario,
    notas: item.notas ?? null,
  }));
}

async function assertProveedorActivo(proveedorId: bigint) {
  const proveedor = await prisma.proveedores.findUnique({
    where: { id: proveedorId },
    select: { id: true, estado: true },
  });
  if (!proveedor) {
    throw new Error('Proveedor no encontrado');
  }
  if (proveedor.estado === 'inactivo') {
    throw new Error('El proveedor está inactivo');
  }
}

async function assertSinOcActivaParaCotizacion(cotizacionId: bigint) {
  const existente = await prisma.ordenes_compra.findFirst({
    where: {
      cotizacion_proveedor_id: cotizacionId,
      estado: { not: 'cancelada' },
    },
    select: { id: true },
  });
  if (existente) {
    throw new Error('Ya existe una orden de compra activa para esta cotización');
  }
}

export const ordenesCompraService = {
  listar: async (filtros?: FiltrosOrdenCompra): Promise<OrdenCompraDetalle[]> => {
    return prisma.ordenes_compra.findMany({
      where: {
        ...(filtros?.proveedor_id && { proveedor_id: BigInt(filtros.proveedor_id) }),
        ...(filtros?.estado && { estado: filtros.estado }),
        ...(filtros?.estado_pago && { estado_pago: filtros.estado_pago }),
        ...(filtros?.cotizacion_proveedor_id && {
          cotizacion_proveedor_id: BigInt(filtros.cotizacion_proveedor_id),
        }),
      },
      include: ORDEN_COMPRA_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  },

  obtenerPorId: async (id: bigint | number): Promise<OrdenCompraDetalle | null> => {
    return prisma.ordenes_compra.findUnique({
      where: { id: BigInt(id) },
      include: ORDEN_COMPRA_INCLUDE,
    });
  },

  crearConItems: async (
    datos: CrearOrdenCompra,
    creadoPor?: string | null,
  ): Promise<OrdenCompraDetalle> => {
    const proveedorId = BigInt(datos.proveedor_id);
    await assertProveedorActivo(proveedorId);

    if (datos.cotizacion_proveedor_id) {
      await assertSinOcActivaParaCotizacion(BigInt(datos.cotizacion_proveedor_id));
    }

    const total_orden = calcularTotalItems(datos.items);

    const ordenId = await prisma.$transaction(async (tx) => {
      const orden = await tx.ordenes_compra.create({
        data: {
          proveedor_id: proveedorId,
          cotizacion_proveedor_id: datos.cotizacion_proveedor_id
            ? BigInt(datos.cotizacion_proveedor_id)
            : null,
          creado_por: creadoPor ?? null,
          estado: 'pendiente',
          estado_pago: 'pendiente',
          total_orden,
          total_pagado: 0,
          fecha_prometida: datos.fecha_prometida ?? null,
          notas: datos.notas ?? null,
        },
      });

      await tx.ordenes_compra_items.createMany({
        data: mapItemsCreate(orden.id, datos.items),
      });

      if (datos.cotizacion_proveedor_id) {
        await tx.cotizaciones_proveedor.update({
          where: { id: BigInt(datos.cotizacion_proveedor_id) },
          data: { estado: 'convertida' },
        });
      }

      return orden.id;
    });

    const creada = await ordenesCompraService.obtenerPorId(ordenId);
    if (!creada) throw new Error('Error al recuperar la orden creada');
    try {
      await ordenesCompraService.generarDocumentoPdf(creada);
    } catch (pdfErr) {
      console.error('[crearConItems] PDF no generado:', pdfErr);
    }
    return creada;
  },

  generarDocumentoPdf: async (orden: OrdenCompraDetalle) => {
    return generarYAlmacenarPdfOrdenCompra(orden);
  },

  crearDesdeCotizacion: async (
    datos: CrearOrdenDesdeCotizacion,
    creadoPor?: string | null,
  ): Promise<OrdenCompraDetalle> => {
    const cotizacionId = BigInt(datos.cotizacion_proveedor_id);

    const cotizacion = await prisma.cotizaciones_proveedor.findUnique({
      where: { id: cotizacionId },
      include: { cotizaciones_proveedor_items: true },
    });

    if (!cotizacion) {
      throw new Error('Cotización de proveedor no encontrada');
    }

    if (!ESTADOS_COTIZACION_PARA_GENERAR_OC.includes(
      cotizacion.estado as (typeof ESTADOS_COTIZACION_PARA_GENERAR_OC)[number],
    )) {
      throw new Error(
        `No se puede generar OC desde una cotización en estado "${cotizacion.estado}"`,
      );
    }

    await assertSinOcActivaParaCotizacion(cotizacionId);

    const items: OrdenCompraItemInput[] = cotizacion.cotizaciones_proveedor_items.map(
      (item) => ({
        material_id: item.material_id != null ? Number(item.material_id) : null,
        insumo_id: item.insumo_id != null ? Number(item.insumo_id) : null,
        cantidad_pedida: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario ?? 0),
        notas: item.notas,
      }),
    );

    if (!items.length) {
      throw new Error('La cotización no tiene ítems para generar la orden');
    }

    for (const item of items) {
      const hasMaterial = item.material_id != null;
      const hasInsumo = item.insumo_id != null;
      if (hasMaterial === hasInsumo) {
        throw new Error(
          'La cotización contiene ítems inválidos (debe tener material o insumo)',
        );
      }
    }

    return ordenesCompraService.crearConItems(
      {
        proveedor_id: Number(cotizacion.proveedor_id),
        cotizacion_proveedor_id: Number(cotizacion.id),
        fecha_prometida: datos.fecha_prometida ?? null,
        notas: datos.notas ?? cotizacion.notas,
        items,
      },
      creadoPor,
    );
  },

  confirmar: async (ordenId: bigint | number): Promise<OrdenCompraDetalle> => {
    const orden = await prisma.ordenes_compra.findUnique({
      where: { id: BigInt(ordenId) },
      select: { estado: true },
    });
    if (!orden) throw new Error('Orden de compra no encontrada');
    if (orden.estado === 'cancelada') {
      throw new Error('No se puede confirmar una orden cancelada');
    }
    if (orden.estado === 'completada') {
      throw new Error('La orden ya está completada');
    }

    await prisma.ordenes_compra.update({
      where: { id: BigInt(ordenId) },
      data: { estado: 'confirmada' },
    });

    const actualizada = await ordenesCompraService.obtenerPorId(ordenId);
    if (!actualizada) throw new Error('Orden no encontrada');
    return actualizada;
  },

  cancelar: async (ordenId: bigint | number): Promise<OrdenCompraDetalle> => {
    const orden = await prisma.ordenes_compra.findUnique({
      where: { id: BigInt(ordenId) },
      select: { estado: true },
    });
    if (!orden) throw new Error('Orden de compra no encontrada');
    if (orden.estado === 'cancelada') {
      throw new Error('La orden ya está cancelada');
    }
    if (orden.estado === 'completada') {
      throw new Error('No se puede cancelar una orden completada');
    }

    await prisma.ordenes_compra.update({
      where: { id: BigInt(ordenId) },
      data: { estado: 'cancelada' },
    });

    const actualizada = await ordenesCompraService.obtenerPorId(ordenId);
    if (!actualizada) throw new Error('Orden no encontrada');
    return actualizada;
  },

  actualizar: async (
    ordenId: bigint | number,
    datos: ActualizarOrdenCompra,
  ): Promise<OrdenCompraDetalle> => {
    const orden = await prisma.ordenes_compra.findUnique({
      where: { id: BigInt(ordenId) },
      select: { estado: true },
    });
    if (!orden) throw new Error('Orden de compra no encontrada');
    if (orden.estado === 'cancelada') {
      throw new Error('No se puede editar una orden cancelada');
    }

    await prisma.ordenes_compra.update({
      where: { id: BigInt(ordenId) },
      data: {
        ...(datos.estado !== undefined && { estado: datos.estado }),
        ...(datos.estado_pago !== undefined && { estado_pago: datos.estado_pago }),
        ...(datos.fecha_prometida !== undefined && { fecha_prometida: datos.fecha_prometida }),
        ...(datos.fecha_recepcion !== undefined && { fecha_recepcion: datos.fecha_recepcion }),
        ...(datos.notas !== undefined && { notas: datos.notas }),
        ...(datos.total_pagado !== undefined && { total_pagado: datos.total_pagado }),
      },
    });

    const actualizada = await ordenesCompraService.obtenerPorId(ordenId);
    if (!actualizada) throw new Error('Orden no encontrada');
    return actualizada;
  },

  obtenerVencidas: async (): Promise<OrdenCompraDetalle[]> => {
    return prisma.ordenes_compra.findMany({
      where: {
        fecha_prometida: { lt: new Date() },
        estado: { in: ['pendiente', 'confirmada', 'parcialmente_recibida'] },
      },
      include: ORDEN_COMPRA_INCLUDE,
      orderBy: { fecha_prometida: 'asc' },
    });
  },

  // Alias para compatibilidad con código existente
  crear: async (
    datos: Prisma.ordenes_compraUncheckedCreateInput,
  ) => {
    return prisma.ordenes_compra.create({
      data: {
        proveedor_id: datos.proveedor_id,
        estado: 'pendiente',
        total_orden: datos.total_orden,
        notas: datos.notas ?? null,
        creado_por: datos.creado_por ?? null,
      },
    });
  },

  obtenerTodas: async (filtros?: FiltrosOrdenCompra) =>
    ordenesCompraService.listar(filtros),

  aprobar: async (ordenId: bigint, observaciones?: string) => {
    await prisma.ordenes_compra.update({
      where: { id: ordenId },
      data: { estado: 'confirmada', notas: observaciones ?? null },
    });
    return ordenesCompraService.obtenerPorId(ordenId);
  },

  recibir: async (ordenId: bigint) => {
    await prisma.ordenes_compra.update({
      where: { id: ordenId },
      data: { estado: 'completada', fecha_recepcion: new Date() },
    });
    return ordenesCompraService.obtenerPorId(ordenId);
  },

  actualizarEstado: async (ordenId: bigint, nuevoEstado: EstadoOrdenCompra) => {
    await prisma.ordenes_compra.update({
      where: { id: ordenId },
      data: { estado: nuevoEstado },
    });
    return ordenesCompraService.obtenerPorId(ordenId);
  },
};
