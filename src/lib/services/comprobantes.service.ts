import { prisma } from '@/lib/prisma';
import { TipoComprobante, EstadoComprobante, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { obtenerProximoCorrelativoSerie } from '@/lib/helpers/comprobante-correlativo.helper';
import {
  type DatosClienteFacturacion,
  type DatosPedidoFacturacion,
  determinarTipoComprobantePorDocumento,
  generarDatosComprobanteSimulado,
  resolverSeriePorTipo,
} from '@/lib/helpers/facturacion-simulada.helper';

// Tipo inferido directamente desde Prisma sin ningún cast
type ComprobanteRow = Prisma.comprobantesGetPayload<Record<string, never>>;

// ── Tipos de entrada ──────────────────────────────────────────────────────────

interface CrearComprobanteInput {
  serie: string;
  tipo: TipoComprobante;
  ruc_emisor: string;
  subtotal: number;
  igv: number;
  total: number;
  moneda?: string;
  fecha_emision?: Date | string;
  pedido_id?: bigint | number | null;
  pago_id?: string | null;
}

interface FiltrosComprobante {
  pedido_id?: bigint | number;
  tipo?: TipoComprobante;
  estado_sunat?: EstadoComprobante;
}

interface EmitirComprobanteSimuladoInput {
  pedido: DatosPedidoFacturacion;
  cliente: DatosClienteFacturacion;
  pagoId?: string | null;
  fechaEmision?: Date;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

export const comprobantesService = {

  crear: async (input: CrearComprobanteInput): Promise<ComprobanteRow> => {
    const proximoCorrelativo = await obtenerProximoCorrelativoSerie(prisma, input.serie);

    return prisma.comprobantes.create({
      data: {
        id_uuid: randomUUID(),
        serie: input.serie,
        correlativo: proximoCorrelativo.toString().padStart(8, '0'),
        tipo: input.tipo,
        ruc_emisor: input.ruc_emisor,
        subtotal: input.subtotal,
        igv: input.igv,
        total: input.total,
        moneda: input.moneda ?? 'PEN',
        fecha_emision: input.fecha_emision != null ? new Date(input.fecha_emision) : new Date(),
        pedido_id: input.pedido_id != null ? BigInt(input.pedido_id) : null,
        pago_id: input.pago_id != null ? String(input.pago_id) : null,
      },
    });
  },

  /**
   * Emite un comprobante simulado (factura/boleta) aceptado por SUNAT
   * a partir de datos de pedido y cliente.
   */
  emitirComprobanteSimulado: async (
    input: EmitirComprobanteSimuladoInput,
  ): Promise<ComprobanteRow> => {
    const tipo = determinarTipoComprobantePorDocumento(input.cliente.ruc);
    const serie = resolverSeriePorTipo(tipo);
    const correlativo = await obtenerProximoCorrelativoSerie(prisma, serie);

    const data = generarDatosComprobanteSimulado({
      pedido: input.pedido,
      cliente: input.cliente,
      pagoId: input.pagoId,
      correlativo,
      fechaEmision: input.fechaEmision,
    });

    return prisma.comprobantes.create({ data });
  },

  listar: (filtros?: FiltrosComprobante): Promise<ComprobanteRow[]> => {
    return prisma.comprobantes.findMany({
      where: {
        ...(filtros?.pedido_id != null && { pedido_id: BigInt(filtros.pedido_id) }),
        ...(filtros?.tipo != null && { tipo: filtros.tipo }),
        ...(filtros?.estado_sunat != null && { estado_sunat: filtros.estado_sunat }),
      },
      orderBy: { fecha_emision: 'desc' },
    });
  },

  obtenerPorId: (idUuid: string): Promise<ComprobanteRow | null> => {
    return prisma.comprobantes.findUnique({
      where: { id_uuid: idUuid },
    });
  },

  // Marca como rechazado en SUNAT y guarda el motivo en respuesta_sunat
  anular: (idUuid: string, motivo: string): Promise<ComprobanteRow> => {
    return prisma.comprobantes.update({
      where: { id_uuid: idUuid },
      data: {
        estado_sunat: EstadoComprobante.rechazado,
        respuesta_sunat: `ANULADO: ${motivo}`,
        updated_at: new Date(),
      },
    });
  },

  obtenerPendientes: (): Promise<ComprobanteRow[]> => {
    return prisma.comprobantes.findMany({
      where: { estado_sunat: EstadoComprobante.pendiente },
      orderBy: { fecha_emision: 'asc' },
    });
  },

  // Comprobantes pendientes cuya fecha de emisión ya pasó
  obtenerVencidos: (): Promise<ComprobanteRow[]> => {
    return prisma.comprobantes.findMany({
      where: {
        estado_sunat: EstadoComprobante.pendiente,
        fecha_emision: { lt: new Date() },
      },
      orderBy: { fecha_emision: 'asc' },
    });
  },

  // Marca como enviado a SUNAT con fecha de envío
  marcarComoEnviado: (idUuid: string): Promise<ComprobanteRow> => {
    return prisma.comprobantes.update({
      where: { id_uuid: idUuid },
      data: {
        estado_sunat: EstadoComprobante.enviado,
        enviado_sunat_at: new Date(),
        updated_at: new Date(),
      },
    });
  },
};