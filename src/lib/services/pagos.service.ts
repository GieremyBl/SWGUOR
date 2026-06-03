import { prisma } from '@/lib/prisma';
import { pagos, Prisma, EstadoPago, MetodoPago, TipoPago } from '@prisma/client';
import { randomUUID } from 'crypto';

interface FiltrosPagos {
  estado?: EstadoPago;
  metodo_pago?: MetodoPago;
  pedido_id?: number | bigint;
}

interface CrearPagoInput {
  pedido_id: number | bigint;
  monto: Prisma.Decimal | number | string;
  metodo_pago: MetodoPago;
  tipo?: TipoPago;
  fecha_pago?: Date;
  comprobante_url?: string;
  notas?: string;
  usuario_id?: number | bigint;
}

export const pagosService = {

  crear: async (datos: CrearPagoInput): Promise<pagos> => {
    return prisma.pagos.create({
      data: {
        id_uuid: randomUUID(),
        pedido_id: BigInt(datos.pedido_id),
        monto: datos.monto,
        metodo_pago: datos.metodo_pago,
        fecha_pago: datos.fecha_pago ?? new Date(),
        tipo: datos.tipo ?? 'pago_completo',
        estado: 'pendiente',
        comprobante_url: datos.comprobante_url ?? null,
        notas: datos.notas ?? null,
        usuario_id: datos.usuario_id ? BigInt(datos.usuario_id) : null,
      },
    });
  },

  obtenerTodas: async (filtros?: FiltrosPagos): Promise<pagos[]> => {
    return prisma.pagos.findMany({
      where: {
        ...(filtros?.estado && { estado: filtros.estado }),
        ...(filtros?.metodo_pago && { metodo_pago: filtros.metodo_pago }),
        ...(filtros?.pedido_id && { pedido_id: BigInt(filtros.pedido_id) }),
      },
      orderBy: { fecha_pago: 'desc' },
    });
  },

  obtenerPorId: async (id_uuid: string): Promise<pagos | null> => {
    return prisma.pagos.findUnique({
      where: { id_uuid },
    });
  },

  procesar: async (id_uuid: string, verificadoPor?: bigint): Promise<pagos> => {
    return prisma.pagos.update({
      where: { id_uuid },
      data: {
        estado: EstadoPago.pago_parcial,
        verificado_at: new Date(),
        verificado_por: verificadoPor ?? null,
      },
    });
  },

  rechazar: async (id_uuid: string, motivo: string): Promise<pagos> => {
    return prisma.pagos.update({
      where: { id_uuid },
      data: { estado: EstadoPago.anulado, notas: motivo },
    });
  },

  reembolsar: async (
    id_uuid: string,
    motivo: string,
    montoReembolso: number,
  ): Promise<pagos> => {
    return prisma.pagos.update({
      where: { id_uuid },
      data: { notas: `REEMBOLSO (${montoReembolso}): ${motivo}` },
    });
  },

  obtenerPendientes: async (): Promise<pagos[]> => {
    return prisma.pagos.findMany({
      where: { estado: EstadoPago.pendiente },
      orderBy: { fecha_pago: 'asc' },
    });
  },

  obtenerVerificados: async (desde: Date, hasta: Date): Promise<pagos[]> => {
    return prisma.pagos.findMany({
      where: {
        estado: EstadoPago.pagado,
        fecha_pago: { gte: desde, lte: hasta },
      },
      orderBy: { fecha_pago: 'desc' },
    });
  },
};