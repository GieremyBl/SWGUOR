import { createHash, randomUUID } from 'crypto';
import type { Prisma, TipoComprobante } from '@prisma/client';
import {
  COMPROBANTE_CORRELATIVO_PAD,
  ESTADO_SUNAT_SIMULADO_ACEPTADO,
  getComprobanteSimuladoBaseUrl,
  getRucEmisorComprobante,
  RESPUESTA_SUNAT_ACEPTADO_BOLETA,
  RESPUESTA_SUNAT_ACEPTADO_FACTURA,
  SERIE_COMPROBANTE_BOLETA,
  SERIE_COMPROBANTE_FACTURA,
  TASA_IGV_COMPROBANTE,
} from '@/lib/constants/comprobantes';

export class FacturacionSimuladaError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'FacturacionSimuladaError';
    this.code = code;
  }
}

export interface DatosPedidoFacturacion {
  id: bigint | number;
  subtotal?: number | null;
  igv?: number | null;
  total: number;
  moneda?: string | null;
}

export interface DatosClienteFacturacion {
  /** Campo `ruc` del cliente: puede contener RUC (11 dígitos) o DNI (8 dígitos) */
  ruc: string;
  razon_social?: string | null;
}

export interface GenerarComprobanteSimuladoInput {
  pedido: DatosPedidoFacturacion;
  cliente: DatosClienteFacturacion;
  correlativo: number;
  pagoId?: string | null;
  fechaEmision?: Date;
}

export interface MontosComprobanteDesglosados {
  subtotal: number;
  igv: number;
  total: number;
}

export type ComprobanteSimuladoCreateData = Prisma.comprobantesCreateInput;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeDocumento(documento: string): string {
  return documento.replace(/\D/g, '');
}

/**
 * RUC (11 dígitos) → factura; DNI (8 dígitos) → boleta.
 */
export function determinarTipoComprobantePorDocumento(
  documento: string,
): TipoComprobante {
  const digits = normalizeDocumento(documento);

  if (digits.length === 11) {
    return 'factura';
  }

  if (digits.length === 8) {
    return 'boleta';
  }

  throw new FacturacionSimuladaError(
    'Documento del cliente inválido: se requiere RUC (11 dígitos) o DNI (8 dígitos)',
    'DOCUMENTO_CLIENTE_INVALIDO',
  );
}

export function resolverSeriePorTipo(tipo: TipoComprobante): string {
  return tipo === 'factura' ? SERIE_COMPROBANTE_FACTURA : SERIE_COMPROBANTE_BOLETA;
}

export function formatearCorrelativo(numero: number): string {
  if (!Number.isFinite(numero) || numero < 1) {
    throw new FacturacionSimuladaError(
      'El correlativo debe ser un entero positivo',
      'CORRELATIVO_INVALIDO',
    );
  }

  return Math.trunc(numero).toString().padStart(COMPROBANTE_CORRELATIVO_PAD, '0');
}

export function formatearNumeroCompleto(serie: string, correlativo: string): string {
  return `${serie}-${correlativo}`;
}

/**
 * Desglosa IGV 18% a partir del total (montos con IGV incluido).
 * Si el pedido ya trae subtotal/igv, los respeta.
 */
export function calcularMontosComprobante(
  pedido: DatosPedidoFacturacion,
): MontosComprobanteDesglosados {
  const total = Number(pedido.total);

  if (!Number.isFinite(total) || total <= 0) {
    throw new FacturacionSimuladaError(
      'El total del pedido debe ser mayor a cero',
      'TOTAL_PEDIDO_INVALIDO',
    );
  }

  const subtotalPedido = pedido.subtotal != null ? Number(pedido.subtotal) : null;
  const igvPedido = pedido.igv != null ? Number(pedido.igv) : null;

  if (
    subtotalPedido != null &&
    igvPedido != null &&
    Number.isFinite(subtotalPedido) &&
    Number.isFinite(igvPedido) &&
    subtotalPedido >= 0 &&
    igvPedido >= 0
  ) {
    return {
      subtotal: roundMoney(subtotalPedido),
      igv: roundMoney(igvPedido),
      total: roundMoney(total),
    };
  }

  const subtotal = roundMoney(total / (1 + TASA_IGV_COMPROBANTE));
  const igv = roundMoney(total - subtotal);

  return { subtotal, igv, total: roundMoney(total) };
}

function generarHashCpeSimulado(
  serie: string,
  correlativo: string,
  montos: MontosComprobanteDesglosados,
): string {
  const payload = `${serie}-${correlativo}|${montos.subtotal}|${montos.igv}|${montos.total}`;
  return createHash('sha256').update(payload).digest('hex');
}

function resolverRespuestaSunatSimulada(tipo: TipoComprobante): string {
  return tipo === 'factura'
    ? RESPUESTA_SUNAT_ACEPTADO_FACTURA
    : RESPUESTA_SUNAT_ACEPTADO_BOLETA;
}

function construirUrlsSimuladas(numeroCompleto: string) {
  const base = getComprobanteSimuladoBaseUrl();
  const slug = encodeURIComponent(numeroCompleto);

  return {
    cdr_url: `${base}/cdr/${slug}.xml`,
    xml_url: `${base}/xml/${slug}.xml`,
    pdf_url: `${base}/pdf/${slug}.pdf`,
  };
}

/**
 * Genera el objeto `data` listo para `prisma.comprobantes.create`,
 * simulando emisión electrónica aceptada por SUNAT.
 */
export function generarDatosComprobanteSimulado(
  input: GenerarComprobanteSimuladoInput,
): ComprobanteSimuladoCreateData {
  const tipo = determinarTipoComprobantePorDocumento(input.cliente.ruc);
  const serie = resolverSeriePorTipo(tipo);
  const correlativo = formatearCorrelativo(input.correlativo);
  const numeroCompleto = formatearNumeroCompleto(serie, correlativo);
  const montos = calcularMontosComprobante(input.pedido);
  const ahora = new Date();
  const urls = construirUrlsSimuladas(numeroCompleto);

  return {
    id_uuid: randomUUID(),
    pedidos: {
      connect: { id: BigInt(input.pedido.id) }
    },
    ...(input.pagoId ? { pago_id: input.pagoId } : {}),
    tipo,
    serie,
    correlativo,
    subtotal: montos.subtotal,
    igv: montos.igv,
    total: montos.total,
    moneda: (input.pedido.moneda ?? 'PEN').toUpperCase().slice(0, 3),
    ruc_emisor: getRucEmisorComprobante(),
    hash_cpe: generarHashCpeSimulado(serie, correlativo, montos),
    cdr_url: urls.cdr_url,
    xml_url: urls.xml_url,
    pdf_url: urls.pdf_url,
    estado_sunat: ESTADO_SUNAT_SIMULADO_ACEPTADO,
    enviado_sunat_at: ahora,
    respuesta_sunat: resolverRespuestaSunatSimulada(tipo),
    fecha_emision: input.fechaEmision ?? ahora,
  };
}

export function isFacturacionSimuladaError(
  error: unknown,
): error is FacturacionSimuladaError {
  return error instanceof FacturacionSimuladaError;
}
