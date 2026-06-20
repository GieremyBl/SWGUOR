import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import { EMPRESA_GUOR } from '@/lib/constants/empresa';
import { getTipoComprobanteLabel } from '@/lib/constants/portal-pago';

const COLOR = {
  ocre: '#b5854b',
  ocreLight: '#fff4e2',
  negro: '#231e1d',
  gris: '#64748b',
  linea: '#e2e8f0',
  texto: '#1e293b',
};

export interface ComprobantePagoPDFData {
  tipo: string;
  numero: string;
  fecha_emision: string;
  fecha_pago: string;
  cliente_nombre: string;
  cliente_documento: string;
  pedido_id: string;
  metodo_pago: string;
  moneda: string;
  subtotal: number;
  igv: number;
  total: number;
  estado_sunat: string;
}

const S = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: COLOR.texto, padding: 36 },
  header: {
    backgroundColor: COLOR.ocreLight,
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLOR.ocre,
    marginBottom: 16,
  },
  empresa: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLOR.negro },
  meta: { fontSize: 8, color: COLOR.gris, marginTop: 2 },
  badge: {
    backgroundColor: COLOR.ocre,
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    alignSelf: 'flex-start',
  },
  section: { marginBottom: 12 },
  label: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.gris,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.linea,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 8,
    backgroundColor: COLOR.ocreLight,
    paddingHorizontal: 8,
  },
  footer: {
    marginTop: 24,
    fontSize: 7,
    color: COLOR.gris,
    textAlign: 'center',
  },
});

function ComprobanteDocument({ d }: { d: ComprobantePagoPDFData }) {
  const symbol = d.moneda === 'PEN' ? 'S/' : d.moneda;
  const fmt = (n: number) =>
    `${symbol} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.empresa}>{EMPRESA_GUOR.razon_social}</Text>
          <Text style={S.meta}>RUC {EMPRESA_GUOR.ruc}</Text>
          <Text style={S.meta}>{EMPRESA_GUOR.direccion}</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={S.badge}>{getTipoComprobanteLabel(d.tipo)}</Text>
            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', marginTop: 6 }}>
              {d.numero}
            </Text>
          </View>
        </View>

        <View style={S.section}>
          <Text style={S.label}>Cliente</Text>
          <Text>{d.cliente_nombre}</Text>
          <Text style={S.meta}>Doc: {d.cliente_documento}</Text>
        </View>

        <View style={S.section}>
          <View style={S.row}>
            <Text>Pedido</Text>
            <Text>#{d.pedido_id}</Text>
          </View>
          <View style={S.row}>
            <Text>Fecha de emisión</Text>
            <Text>{d.fecha_emision}</Text>
          </View>
          <View style={S.row}>
            <Text>Fecha de pago</Text>
            <Text>{d.fecha_pago}</Text>
          </View>
          <View style={S.row}>
            <Text>Método de pago</Text>
            <Text>{d.metodo_pago}</Text>
          </View>
          <View style={S.row}>
            <Text>Estado SUNAT (simulado)</Text>
            <Text>{d.estado_sunat}</Text>
          </View>
        </View>

        <View style={S.section}>
          <View style={S.row}>
            <Text>Subtotal</Text>
            <Text>{fmt(d.subtotal)}</Text>
          </View>
          <View style={S.row}>
            <Text>IGV</Text>
            <Text>{fmt(d.igv)}</Text>
          </View>
          <View style={S.totalRow}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Total</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmt(d.total)}</Text>
          </View>
        </View>

        <Text style={S.footer}>
          Comprobante electrónico simulado — {EMPRESA_GUOR.web} · {EMPRESA_GUOR.email}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderComprobantePagoPdfBuffer(
  data: ComprobantePagoPDFData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<ComprobanteDocument d={data} />);
  return Buffer.from(buffer);
}

export function formatFechaPdf(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
