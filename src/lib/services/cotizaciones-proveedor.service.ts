import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  ESTADO_COTIZACION_PROVEEDOR,
  TRANSICIONES_COTIZACION_PROVEEDOR,
} from '@/lib/constants/cotizacion-proveedor-estados';
import type {
  ActualizarCotizacionProveedorInput,
  CrearCotizacionProveedorInput,
  CotizacionProveedorItemInput,
} from '@/lib/schemas/cotizaciones-proveedor';
import {
  COTIZACION_PROVEEDOR_INCLUDE,
  type CotizacionProveedorDetalle,
} from '@/lib/services/cotizaciones-proveedor.types';
import { buildCotizacionItemsCreateData } from '@/lib/services/cotizacion-proveedor-items.helper';

export type { CotizacionProveedorDetalle };

export interface FiltrosCotizacionProveedor {
  estado?: string;
  proveedor_id?: bigint;
  busqueda?: string;
  page?: number;
  limit?: number;
}

function calcularTotal(items: CotizacionProveedorItemInput[]): number {
  return items.reduce(
    (acc, item) => acc + item.cantidad * item.precio_unitario,
    0,
  );
}

async function assertProveedorActivo(proveedorId: bigint) {
  const p = await prisma.proveedores.findUnique({
    where: { id: proveedorId },
    select: { id: true, estado: true },
  });
  if (!p) throw new Error('Proveedor no encontrado');
  if (p.estado === 'inactivo') throw new Error('El proveedor está inactivo');
}

function assertPuedeEditar(estado: string) {
  if (estado !== ESTADO_COTIZACION_PROVEEDOR.BORRADOR) {
    throw new Error(
      'Solo se pueden editar cotizaciones en estado borrador. Reabra desde cerrado si aplica.',
    );
  }
}

export function assertTransicionEstado(estadoActual: string, estadoNuevo: string) {
  if (estadoActual === estadoNuevo) return;
  const permitidos = TRANSICIONES_COTIZACION_PROVEEDOR[estadoActual] ?? [];
  if (!permitidos.includes(estadoNuevo)) {
    throw new Error(
      `No se puede cambiar de "${estadoActual}" a "${estadoNuevo}"`,
    );
  }
}

async function syncItems(
  tx: Prisma.TransactionClient,
  cotizacionId: bigint,
  proveedorId: bigint,
  items: CotizacionProveedorItemInput[],
) {
  await tx.cotizaciones_proveedor_items.deleteMany({
    where: { cotizacion_id: cotizacionId },
  });
  if (items.length > 0) {
    const data = await buildCotizacionItemsCreateData(
      tx,
      cotizacionId,
      proveedorId,
      items,
    );
    await tx.cotizaciones_proveedor_items.createMany({ data });
  }
}

export const cotizacionesProveedorService = {
  listar: async (filtros: FiltrosCotizacionProveedor = {}) => {
    const page = Math.max(filtros.page ?? 1, 1);
    const limit = Math.min(Math.max(filtros.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.cotizaciones_proveedorWhereInput = {};
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.proveedor_id) where.proveedor_id = filtros.proveedor_id;

    if (filtros.busqueda) {
      const q = filtros.busqueda;
      where.OR = [
        { numero_externo: { contains: q, mode: 'insensitive' } },
        { notas: { contains: q, mode: 'insensitive' } },
        { proveedores: { razon_social: { contains: q, mode: 'insensitive' } } },
        { proveedores: { ruc: { contains: q } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.cotizaciones_proveedor.findMany({
        where,
        include: COTIZACION_PROVEEDOR_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.cotizaciones_proveedor.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  },

  obtenerPorId: async (id: bigint | number): Promise<CotizacionProveedorDetalle | null> => {
    return prisma.cotizaciones_proveedor.findUnique({
      where: { id: BigInt(id) },
      include: COTIZACION_PROVEEDOR_INCLUDE,
    });
  },

  crear: async (
    datos: CrearCotizacionProveedorInput,
    solicitadoPor?: string | null,
  ): Promise<CotizacionProveedorDetalle> => {
    const proveedorId = BigInt(datos.proveedor_id);
    await assertProveedorActivo(proveedorId);

    const total_estimado = calcularTotal(datos.items);

    const id = await prisma.$transaction(async (tx) => {
      const cot = await tx.cotizaciones_proveedor.create({
        data: {
          proveedor_id: proveedorId,
          solicitado_por: solicitadoPor ?? null,
          estado: ESTADO_COTIZACION_PROVEEDOR.BORRADOR,
          fecha_solicitud: new Date(datos.fecha_solicitud),
          fecha_vencimiento: datos.fecha_vencimiento
            ? new Date(datos.fecha_vencimiento)
            : null,
          numero_externo: datos.numero_externo?.trim() || null,
          moneda: datos.moneda ?? 'PEN',
          notas: datos.notas ?? null,
          total_estimado,
        },
      });

      await syncItems(tx, cot.id, proveedorId, datos.items);
      return cot.id;
    });

    const creada = await cotizacionesProveedorService.obtenerPorId(id);
    if (!creada) throw new Error('Error al recuperar la cotización creada');
    return creada;
  },

  actualizar: async (
    id: bigint | number,
    datos: ActualizarCotizacionProveedorInput,
  ): Promise<CotizacionProveedorDetalle> => {
    const existente = await cotizacionesProveedorService.obtenerPorId(id);
    if (!existente) throw new Error('Cotización no encontrada');
    assertPuedeEditar(existente.estado);

    const proveedorId = BigInt(datos.proveedor_id);
    await assertProveedorActivo(proveedorId);

    const total_estimado = calcularTotal(datos.items);

    await prisma.$transaction(async (tx) => {
      await tx.cotizaciones_proveedor.update({
        where: { id: BigInt(id) },
        data: {
          proveedor_id: proveedorId,
          fecha_solicitud: new Date(datos.fecha_solicitud),
          fecha_vencimiento: datos.fecha_vencimiento
            ? new Date(datos.fecha_vencimiento)
            : null,
          numero_externo: datos.numero_externo?.trim() || null,
          moneda: datos.moneda ?? 'PEN',
          notas: datos.notas ?? null,
          total_estimado,
          updated_at: new Date(),
        },
      });
      await syncItems(tx, BigInt(id), proveedorId, datos.items);
    });

    const actualizada = await cotizacionesProveedorService.obtenerPorId(id);
    if (!actualizada) throw new Error('Error al recuperar la cotización');
    return actualizada;
  },

  cambiarEstado: async (
    id: bigint | number,
    estadoNuevo: string,
  ): Promise<CotizacionProveedorDetalle> => {
    const existente = await cotizacionesProveedorService.obtenerPorId(id);
    if (!existente) throw new Error('Cotización no encontrada');

    assertTransicionEstado(existente.estado, estadoNuevo);

    await prisma.cotizaciones_proveedor.update({
      where: { id: BigInt(id) },
      data: { estado: estadoNuevo, updated_at: new Date() },
    });

    const actualizada = await cotizacionesProveedorService.obtenerPorId(id);
    if (!actualizada) throw new Error('Error al actualizar estado');
    return actualizada;
  },

  marcarConvertida: async (id: bigint | number) => {
    return prisma.cotizaciones_proveedor.update({
      where: { id: BigInt(id) },
      data: {
        estado: ESTADO_COTIZACION_PROVEEDOR.CONVERTIDA,
        updated_at: new Date(),
      },
    });
  },

  actualizarPdfUrl: async (id: bigint | number, pdf_url: string) => {
    return prisma.cotizaciones_proveedor.update({
      where: { id: BigInt(id) },
      data: { pdf_url, updated_at: new Date() },
    });
  },

  anular: async (id: bigint | number) => {
    return cotizacionesProveedorService.cambiarEstado(
      id,
      ESTADO_COTIZACION_PROVEEDOR.ANULADO,
    );
  },
};
