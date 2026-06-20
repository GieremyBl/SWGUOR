import type { comprobantes, cotizaciones, guias_remision, pagos } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface DocumentoPedido {
  id_referencia: string;
  tipo_documento: string;
  numero_documento: string;
  fecha_emision: string;
  url_archivo: string;
}

export class DocumentosPedidoError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'VALIDATION' = 'VALIDATION',
  ) {
    super(message);
    this.name = 'DocumentosPedidoError';
  }
}

const TIPO_COMPROBANTE_LABEL: Record<string, string> = {
  factura: 'Factura',
  boleta: 'Boleta',
  nota_credito: 'Nota de Crédito',
  nota_debito: 'Nota de Débito',
};

function toPedidoId(value: string | number | bigint): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new DocumentosPedidoError('ID de pedido inválido', 'VALIDATION');
  }
}

function esUrlArchivoValida(url: string | null | undefined): url is string {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function toIsoFecha(value: Date | string | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function resolverNumeroComprobante(comp: comprobantes): string {
  if (comp.numero_completo?.trim()) return comp.numero_completo.trim();
  return `${comp.serie}-${comp.correlativo}`;
}

function mapComprobante(comp: comprobantes): DocumentoPedido | null {
  if (!esUrlArchivoValida(comp.pdf_url)) return null;

  return {
    id_referencia: comp.id_uuid,
    tipo_documento: TIPO_COMPROBANTE_LABEL[comp.tipo] ?? 'Comprobante',
    numero_documento: resolverNumeroComprobante(comp),
    fecha_emision: toIsoFecha(comp.fecha_emision),
    url_archivo: comp.pdf_url.trim(),
  };
}

function mapGuiaRemision(guia: guias_remision): DocumentoPedido | null {
  if (!esUrlArchivoValida(guia.pdf_url)) return null;

  return {
    id_referencia: guia.id.toString(),
    tipo_documento: 'Guía de Remisión',
    numero_documento: guia.numero,
    fecha_emision: toIsoFecha(guia.fecha_emision),
    url_archivo: guia.pdf_url.trim(),
  };
}

function mapPagoVoucher(pago: pagos): DocumentoPedido | null {
  if (!esUrlArchivoValida(pago.comprobante_url)) return null;

  return {
    id_referencia: pago.id_uuid,
    tipo_documento: 'Voucher de Pago',
    numero_documento: `PAG-${pago.id_uuid.slice(0, 8).toUpperCase()}`,
    fecha_emision: toIsoFecha(pago.fecha_pago),
    url_archivo: pago.comprobante_url.trim(),
  };
}

function mapCotizacion(cotizacion: cotizaciones): DocumentoPedido | null {
  // El modelo cotizaciones no expone URL de archivo; si se añade en el futuro, mapear aquí.
  void cotizacion;
  return null;
}

function ordenarPorFechaDesc(documentos: DocumentoPedido[]): DocumentoPedido[] {
  return [...documentos].sort(
    (a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime(),
  );
}

export const DocumentosService = {
  async obtenerExpedientePedido(pedidoId: string | number | bigint): Promise<DocumentoPedido[]> {
    const id = toPedidoId(pedidoId);

    const pedido = await prisma.pedidos.findUnique({
      where: { id },
      include: {
        comprobantes: true,
        guias_remision: true,
        pagos: true,
        cotizacion: true,
      },
    });

    if (!pedido) {
      throw new DocumentosPedidoError('Pedido no encontrado', 'NOT_FOUND');
    }

    const documentos: DocumentoPedido[] = [];
    const vistos = new Set<string>();

    const agregar = (doc: DocumentoPedido | null) => {
      if (!doc) return;
      const clave = `${doc.tipo_documento}|${doc.id_referencia}`;
      if (vistos.has(clave)) return;
      vistos.add(clave);
      documentos.push(doc);
    };

    for (const comp of pedido.comprobantes) {
      agregar(mapComprobante(comp));
    }

    for (const guia of pedido.guias_remision) {
      agregar(mapGuiaRemision(guia));
    }

    for (const pago of pedido.pagos) {
      agregar(mapPagoVoucher(pago));
    }

    if (pedido.cotizacion) {
      agregar(mapCotizacion(pedido.cotizacion));
    }

    return ordenarPorFechaDesc(documentos);
  },
};

export function isDocumentosPedidoError(error: unknown): error is DocumentosPedidoError {
  return error instanceof DocumentosPedidoError;
}
