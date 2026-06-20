import { prisma } from '@/lib/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  STORAGE_BUCKET_DOCUMENTOS,
  comprobantePdfStoragePath,
} from '@/lib/constants/storage';
import { METODO_PAGO_LABELS } from '@/components/admin/pedidos/detalles/types';
import {
  formatFechaPdf,
  renderComprobantePagoPdfBuffer,
  type ComprobantePagoPDFData,
} from '@/lib/pdf/comprobante-pago-pdf';
import { obtenerProximoCorrelativoSerie } from '@/lib/helpers/comprobante-correlativo.helper';
import {
  determinarTipoComprobantePorDocumento,
  generarDatosComprobanteSimulado,
  resolverSeriePorTipo,
} from '@/lib/helpers/facturacion-simulada.helper';

export interface PedidoDocumentoAdmin {
  id: string;
  tipo: string;
  numero: string;
  fecha_emision: string;
  fecha_pago: string | null;
  url: string;
  monto: number | null;
}

function esUrlPdfAlmacenada(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  if (url.includes('/api/comprobantes/simulado')) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getComprobantePdfPublicUrl(comprobanteId: string): string {
  const supabase = createAdminClient();
  const path = comprobantePdfStoragePath(comprobanteId);
  const { data } = supabase.storage.from(STORAGE_BUCKET_DOCUMENTOS).getPublicUrl(path);
  return data.publicUrl;
}

export async function generarYAlmacenarPdfComprobante(
  comprobanteId: string,
): Promise<string> {
  const comprobante = await prisma.comprobantes.findUnique({
    where: { id_uuid: comprobanteId },
    include: {
      pedidos: {
        include: {
          clientes: {
            select: { razon_social: true, nombre_comercial: true, ruc: true },
          },
        },
      },
      pagos: { select: { fecha_pago: true, metodo_pago: true, monto: true } },
    },
  });

  if (!comprobante) {
    throw new Error('Comprobante no encontrado');
  }

  const cliente = comprobante.pedidos?.clientes;
  const numero =
    comprobante.numero_completo ??
    `${comprobante.serie}-${comprobante.correlativo}`;

  const pdfData: ComprobantePagoPDFData = {
    tipo: comprobante.tipo,
    numero,
    fecha_emision: formatFechaPdf(comprobante.fecha_emision),
    fecha_pago: formatFechaPdf(comprobante.pagos?.fecha_pago),
    cliente_nombre:
      cliente?.razon_social ?? cliente?.nombre_comercial ?? 'Cliente',
    cliente_documento: cliente?.ruc ?? '—',
    pedido_id: String(comprobante.pedido_id ?? ''),
    metodo_pago:
      METODO_PAGO_LABELS[comprobante.pagos?.metodo_pago ?? ''] ??
      comprobante.pagos?.metodo_pago ??
      '—',
    moneda: comprobante.moneda ?? 'PEN',
    subtotal: Number(comprobante.subtotal),
    igv: Number(comprobante.igv),
    total: Number(comprobante.total),
    estado_sunat: comprobante.estado_sunat,
  };

  const buffer = await renderComprobantePagoPdfBuffer(pdfData);
  const path = comprobantePdfStoragePath(comprobanteId);
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET_DOCUMENTOS)
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    throw new Error(`No se pudo almacenar el PDF del comprobante: ${error.message}`);
  }

  const pdfUrl = getComprobantePdfPublicUrl(comprobanteId);

  await prisma.comprobantes.update({
    where: { id_uuid: comprobanteId },
    data: { pdf_url: pdfUrl, updated_at: new Date() },
  });

  return pdfUrl;
}

const TIPO_COMPROBANTE_LABEL: Record<string, string> = {
  factura: 'Factura',
  boleta: 'Boleta',
  nota_credito: 'Nota de crédito',
  nota_debito: 'Nota de débito',
};

function mapComprobanteDoc(
  comp: {
    id_uuid: string;
    tipo: string;
    serie: string;
    correlativo: string;
    numero_completo: string | null;
    fecha_emision: Date;
    pdf_url: string | null;
    total: unknown;
    pagos: { fecha_pago: Date | null; monto: unknown } | null;
  },
  pdfUrl: string,
): PedidoDocumentoAdmin {
  const numero = comp.numero_completo ?? `${comp.serie}-${comp.correlativo}`;
  return {
    id: comp.id_uuid,
    tipo: TIPO_COMPROBANTE_LABEL[comp.tipo] ?? 'Comprobante',
    numero,
    fecha_emision: comp.fecha_emision.toISOString(),
    fecha_pago: comp.pagos?.fecha_pago?.toISOString() ?? null,
    url: pdfUrl,
    monto: comp.pagos ? Number(comp.pagos.monto) : Number(comp.total),
  };
}

/**
 * Crea comprobante electrónico simulado para pagos confirmados sin factura vinculada.
 */
async function sincronizarComprobantesPagosPedido(
  pedido: {
    id: bigint;
    moneda: string | null;
    clientes: { ruc: string | null; razon_social: string | null } | null;
    pagos: Array<{
      id_uuid: string;
      monto: unknown;
      estado: string;
      fecha_pago: Date | null;
    }>;
    comprobantes: Array<{ pago_id: string | null }>;
  },
): Promise<void> {
  const cliente = pedido.clientes;
  if (!cliente?.ruc?.trim()) return;

  const pagosConComprobante = new Set(
    pedido.comprobantes.map((c) => c.pago_id).filter(Boolean),
  );

  for (const pago of pedido.pagos) {
    if (pagosConComprobante.has(pago.id_uuid)) continue;
    if (pago.estado !== 'pagado' && pago.estado !== 'pago_parcial') continue;

    try {
      const tipo = determinarTipoComprobantePorDocumento(cliente.ruc);
      const serie = resolverSeriePorTipo(tipo);
      const correlativo = await obtenerProximoCorrelativoSerie(prisma, serie);
      const data = generarDatosComprobanteSimulado({
        pedido: {
          id: pedido.id,
          total: Number(pago.monto),
          moneda: pedido.moneda,
        },
        cliente: {
          ruc: cliente.ruc,
          razon_social: cliente.razon_social,
        },
        pagoId: pago.id_uuid,
        correlativo,
        fechaEmision: pago.fecha_pago ?? new Date(),
      });
      const comp = await prisma.comprobantes.create({ data });
      await generarYAlmacenarPdfComprobante(comp.id_uuid);
    } catch (err) {
      console.error('[sincronizarComprobantesPagosPedido] pago', pago.id_uuid, err);
    }
  }
}

/**
 * Asegura PDFs en Storage y devuelve expediente documental del pedido (admin).
 */
export async function obtenerDocumentosPedidoAdmin(
  pedidoId: bigint | number,
): Promise<PedidoDocumentoAdmin[]> {
  const id = BigInt(pedidoId);

  const pedido = await prisma.pedidos.findUnique({
    where: { id },
    include: {
      clientes: { select: { ruc: true, razon_social: true } },
      comprobantes: {
        include: { pagos: { select: { fecha_pago: true, monto: true } } },
        orderBy: { fecha_emision: 'desc' },
      },
      guias_remision: { orderBy: { fecha_emision: 'desc' } },
      pagos: {
        where: { estado: { in: ['pagado', 'pago_parcial'] } },
        orderBy: { fecha_pago: 'desc' },
      },
    },
  });

  if (!pedido) return [];

  await sincronizarComprobantesPagosPedido(pedido);

  const pedidoActualizado = await prisma.pedidos.findUnique({
    where: { id },
    include: {
      comprobantes: {
        include: { pagos: { select: { fecha_pago: true, monto: true } } },
        orderBy: { fecha_emision: 'desc' },
      },
      guias_remision: { orderBy: { fecha_emision: 'desc' } },
    },
  });

  if (!pedidoActualizado) return [];

  const documentos: PedidoDocumentoAdmin[] = [];

  for (const comp of pedidoActualizado.comprobantes) {
    let pdfUrl = comp.pdf_url ?? '';
    if (!esUrlPdfAlmacenada(pdfUrl)) {
      try {
        pdfUrl = await generarYAlmacenarPdfComprobante(comp.id_uuid);
      } catch (err) {
        console.error('[obtenerDocumentosPedidoAdmin] PDF comprobante', comp.id_uuid, err);
        continue;
      }
    }
    documentos.push(mapComprobanteDoc(comp, pdfUrl));
  }

  for (const guia of pedidoActualizado.guias_remision) {
    if (!esUrlPdfAlmacenada(guia.pdf_url)) continue;
    documentos.push({
      id: String(guia.id),
      tipo: 'Guía de remisión',
      numero: guia.numero,
      fecha_emision: guia.fecha_emision.toISOString(),
      fecha_pago: guia.fecha_entrega?.toISOString() ?? null,
      url: guia.pdf_url!,
      monto: null,
    });
  }

  return documentos.sort(
    (a, b) =>
      new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime(),
  );
}
