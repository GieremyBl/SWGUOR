import { prisma } from '@/lib/prisma';
import { reservas_stock } from '@prisma/client';

// Campos reales del modelo 'reservas_stock':
//   id, variante_id, cotizacion_id, pedido_id, cantidad, expira_en, estado

interface FiltrosReserva {
  variante_id?:   number | bigint;
  pedido_id?:     number | bigint;
  cotizacion_id?: number | bigint;
  estado?:        string;
}

interface CrearReservaInput {
  variante_id:    number | bigint;
  cantidad:       number;
  cotizacion_id?: number | bigint;
  pedido_id?:     number | bigint;
  expira_en?:     Date;
}

export const reservaStockService = {
  crear: async (datos: CrearReservaInput): Promise<reservas_stock> => {
    return prisma.reservas_stock.create({
      data: {
        variante_id:   BigInt(datos.variante_id),
        cantidad:      datos.cantidad,
        cotizacion_id: datos.cotizacion_id ? BigInt(datos.cotizacion_id) : null,
        pedido_id:     datos.pedido_id     ? BigInt(datos.pedido_id)     : null,
        expira_en:     datos.expira_en     ?? new Date(Date.now() + 30 * 60 * 1000),
        estado:        'activa',
      },
    });
  },

  obtenerTodas: async (filtros?: FiltrosReserva): Promise<reservas_stock[]> => {
    return prisma.reservas_stock.findMany({
      where: {
        ...(filtros?.variante_id   && { variante_id:   BigInt(filtros.variante_id) }),
        ...(filtros?.pedido_id     && { pedido_id:     BigInt(filtros.pedido_id) }),
        ...(filtros?.cotizacion_id && { cotizacion_id: BigInt(filtros.cotizacion_id) }),
        ...(filtros?.estado        && { estado:        filtros.estado }),
      },
      orderBy: { expira_en: 'asc' },
    });
  },

  obtenerPorId: async (id: bigint): Promise<reservas_stock | null> => {
    return prisma.reservas_stock.findUnique({ where: { id } });
  },

  // El schema no tiene cantidadDisponible; se marca el estado como utilizada
  utilizar: async (id: bigint): Promise<reservas_stock> => {
    return prisma.reservas_stock.update({
      where: { id },
      data:  { estado: 'utilizada' },
    });
  },

  cancelar: async (id: bigint): Promise<reservas_stock> => {
    return prisma.reservas_stock.update({
      where: { id },
      data:  { estado: 'cancelada' },
    });
  },

  obtenerReservasVencidas: async (): Promise<reservas_stock[]> => {
    return prisma.reservas_stock.findMany({
      where: {
        estado:    'activa',
        expira_en: { lt: new Date() },
      },
    });
  },

  obtenerResumenPorVariante: async (
    varianteId: bigint,
  ): Promise<{ totalReservado: number; cantidad: number }> => {
    const reservas = await prisma.reservas_stock.findMany({
      where: { variante_id: varianteId, estado: 'activa' },
    });

    return {
      totalReservado: reservas.reduce((sum, r) => sum + Number(r.cantidad), 0),
      cantidad:       reservas.length,
    };
  },
};