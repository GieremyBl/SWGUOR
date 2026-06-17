import { prisma } from '@/lib/prisma';
import type { reservas_stock } from '@prisma/client';

// Campos reales del modelo 'reservas_stock':
//   id, variante_id, cotizacion_id, pedido_id, cantidad, expira_en, estado

export interface FiltrosReserva {
  variante_id?: number | bigint | string;
  pedido_id?: number | bigint | string;
  cotizacion_id?: number | bigint | string;
  estado?: string;
}

export interface CrearReservaInput {
  variante_id: number | bigint | string;
  cantidad: number;
  cotizacion_id?: number | bigint | string;
  pedido_id?: number | bigint | string;
  expira_en?: Date;
}

export const reservaStockService = {

  crear: async (datos: CrearReservaInput): Promise<reservas_stock> => {
    return prisma.reservas_stock.create({
      data: {
        variante_id: BigInt(datos.variante_id),
        cantidad: datos.cantidad,
        cotizacion_id: datos.cotizacion_id ? BigInt(datos.cotizacion_id) : null,
        pedido_id: datos.pedido_id ? BigInt(datos.pedido_id) : null,
        expira_en: datos.expira_en ?? new Date(Date.now() + 30 * 60 * 1000), // 30 minutos por defecto
        estado: 'activa',
      },
    });
  },

  obtenerTodas: async (filtros?: FiltrosReserva): Promise<reservas_stock[]> => {
    return prisma.reservas_stock.findMany({
      where: {
        ...(filtros?.variante_id && { variante_id: BigInt(filtros.variante_id) }),
        ...(filtros?.pedido_id && { pedido_id: BigInt(filtros.pedido_id) }),
        ...(filtros?.cotizacion_id && { cotizacion_id: BigInt(filtros.cotizacion_id) }),
        ...(filtros?.estado && { estado: filtros.estado }),
      },
      orderBy: { expira_en: 'asc' },
    });
  },

  obtenerPorId: async (id: bigint | string | number): Promise<reservas_stock | null> => {
    return prisma.reservas_stock.findUnique({
      where: { id: BigInt(id) }
    });
  },

  /**
   * Transiciona una reserva a utilizada. 
   * Nota: El descuento físico del kárdex lo ejecuta el flujo de despacho/pedidos.
   */
  utilizar: async (id: bigint | string | number): Promise<reservas_stock> => {
    return prisma.reservas_stock.update({
      where: { id: BigInt(id) },
      data: { estado: 'utilizada' },
    });
  },

  /**
   * Cancela la reserva liberando las unidades para que vuelvan a estar disponibles lógicamente.
   */
  cancelar: async (id: bigint | string | number): Promise<reservas_stock> => {
    return prisma.reservas_stock.update({
      where: { id: BigInt(id) },
      data: { estado: 'cancelada' },
    });
  },

  obtenerReservasVencidas: async (): Promise<reservas_stock[]> => {
    return prisma.reservas_stock.findMany({
      where: {
        estado: 'activa',
        expira_en: { lt: new Date() },
      },
    });
  },

  obtenerResumenPorVariante: async (
    varianteId: bigint | string | number
  ): Promise<{ totalReservado: number; cantidad: number }> => {
    const reservas = await prisma.reservas_stock.findMany({
      where: {
        variante_id: BigInt(varianteId),
        estado: 'activa'
      },
    });

    return {
      totalReservado: reservas.reduce((sum, r) => sum + Number(r.cantidad), 0),
      cantidad: reservas.length,
    };
  },
};