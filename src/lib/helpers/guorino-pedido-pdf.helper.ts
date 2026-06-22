import type { GuorinoPedidoPreview } from '@/lib/services/guorino-pedido.service';
import type { CotizacionPDFData } from '@/lib/utils/export-utils';
import {
  exportCotizacionIndividualToPDF,
  generarCotizacionIndividualPDFBlob,
} from '@/lib/utils/export-utils';

export function buildGuorinoPedidoPreviewPDFData(
  preview: GuorinoPedidoPreview,
  cliente: {
    razon_social?: string | null;
    ruc?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion_fiscal?: string | null;
  },
): CotizacionPDFData {
  const fecha = new Date(preview.created_at);
  const validoHasta = new Date(preview.expira_en);

  return {
    numero: `PED-PREV-${preview.id.slice(-6).toUpperCase()}`,
    fecha: fecha.toLocaleDateString('es-PE'),
    valido_hasta: validoHasta.toLocaleDateString('es-PE'),
    cliente_nombre: cliente.razon_social ?? 'Cliente',
    cliente_ruc: cliente.ruc ?? undefined,
    cliente_telefono: cliente.telefono ?? undefined,
    cliente_email: cliente.email ?? undefined,
    cliente_direccion: cliente.direccion_fiscal ?? preview.direccion_despacho ?? undefined,
    moneda: 'Soles (PEN)',
    zona_envio: undefined,
    notas: preview.notas_cliente ?? 'Previsualización generada por Guorino. Confirme para registrar el pedido.',
    items: preview.items.map((item, index) => ({
      numero: index + 1,
      descripcion: item.nombre,
      talla: item.talla || '—',
      color: item.color || '—',
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      total: item.subtotal,
    })),
    subtotal: preview.totales.subtotal_bruto,
    descuento_pct:
      preview.totales.subtotal_bruto > 0
        ? Math.round((preview.totales.monto_descuento / preview.totales.subtotal_bruto) * 100)
        : 0,
    descuento_monto: preview.totales.monto_descuento,
    costo_envio: preview.totales.costo_envio,
    igv: preview.totales.igv,
    total: preview.totales.total,
  };
}

export async function descargarPreviewPedidoGuorinoPDF(
  preview: GuorinoPedidoPreview,
  cliente: Parameters<typeof buildGuorinoPedidoPreviewPDFData>[1],
) {
  const data = buildGuorinoPedidoPreviewPDFData(preview, cliente);
  await exportCotizacionIndividualToPDF(data);
}

export async function abrirPreviewPedidoGuorinoPDF(
  preview: GuorinoPedidoPreview,
  cliente: Parameters<typeof buildGuorinoPedidoPreviewPDFData>[1],
) {
  if (typeof window === 'undefined') return;

  const data = buildGuorinoPedidoPreviewPDFData(preview, cliente);
  const blob = await generarCotizacionIndividualPDFBlob(data);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
