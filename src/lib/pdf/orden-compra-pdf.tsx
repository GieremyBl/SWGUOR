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
import { ESTADOS_ORDEN_COMPRA, ESTADOS_PAGO_ORDEN_COMPRA } from '@/lib/constants/estados';
import { formatNumeroOc } from '@/lib/helpers/ordenes-compra-helpers';
import type { OrdenCompraDetalle } from '@/lib/services/ordenes-compra.types';

const COLOR = {
  ocre: '#b5854b',
  ocreDark: '#9a6e3a',
  ocreLight: '#fff4e2',
  negro: '#231e1d',
  gris: '#64748b',
  blanco: '#ffffff',
  linea: '#e2e8f0',
  texto: '#1e293b',
};

export interface OrdenCompraPDFData {
  numero: string;
  fecha: string;
  fecha_prometida: string;
  proveedor_nombre: string;
  proveedor_ruc: string;
  proveedor_contacto: string;
  proveedor_telefono: string;
  proveedor_email: string;
  proveedor_direccion: string;
  estado: string;
  estado_pago: string;
  cotizacion_ref: string;
  moneda: string;
  items: {
    numero: number;
    descripcion: string;
    tipo: string;
    unidad: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
  }[];
  subtotal: number;
  total: number;
  notas?: string;
}

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLOR.texto,
    paddingBottom: 36,
  },
  headerStrip: {
    backgroundColor: COLOR.ocreLight,
    paddingHorizontal: 36,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 3,
    borderBottomColor: COLOR.ocre,
  },
  empresa: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.negro,
  },
  headerMeta: { fontSize: 8, color: COLOR.gris, marginTop: 2 },
  badge: {
    backgroundColor: COLOR.ocre,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    color: COLOR.blanco,
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  headerRight: { alignItems: 'flex-end', gap: 3 },
  docNumero: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLOR.negro },
  docFecha: { fontSize: 8, color: COLOR.gris },
  sectionRow: {
    flexDirection: 'row',
    paddingHorizontal: 36,
    marginTop: 18,
    gap: 14,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLOR.linea,
    borderRadius: 6,
    padding: 12,
  },
  cardTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.ocre,
    textTransform: 'uppercase',
    marginBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.ocreLight,
    paddingBottom: 4,
  },
  cardRow: { flexDirection: 'row', marginBottom: 3 },
  cardLabel: { fontSize: 8, color: COLOR.gris, width: 72 },
  cardValue: { fontSize: 8, color: COLOR.texto, fontFamily: 'Helvetica-Bold', flex: 1 },
  cardValueNormal: { fontSize: 8, color: COLOR.texto, flex: 1 },
  tableWrap: {
    marginHorizontal: 36,
    marginTop: 18,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLOR.linea,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: COLOR.negro,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableHeadCell: {
    color: COLOR.blanco,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: COLOR.linea,
  },
  tableRowAlt: { backgroundColor: COLOR.ocreLight },
  tableCell: { fontSize: 8, color: COLOR.texto },
  tableCellBold: { fontSize: 8, color: COLOR.texto, fontFamily: 'Helvetica-Bold' },
  colNum: { width: '6%' },
  colDesc: { width: '34%' },
  colTipo: { width: '12%' },
  colCant: { width: '12%', textAlign: 'right' },
  colPUnit: { width: '18%', textAlign: 'right' },
  colTotal: { width: '18%', textAlign: 'right' },
  totalesWrap: {
    marginHorizontal: 36,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalesBox: {
    width: 220,
    borderWidth: 1,
    borderColor: COLOR.linea,
    borderRadius: 6,
    overflow: 'hidden',
  },
  totalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.linea,
  },
  totalesLabel: { fontSize: 8, color: COLOR.gris },
  totalesValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLOR.texto },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLOR.negro,
  },
  totalFinalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLOR.blanco },
  totalFinalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLOR.ocreLight },
  notasWrap: {
    marginHorizontal: 36,
    marginTop: 16,
    padding: 10,
    backgroundColor: COLOR.ocreLight,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLOR.ocre,
  },
  notasTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.ocreDark,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  notasText: { fontSize: 8, color: COLOR.gris },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLOR.negro,
    paddingVertical: 9,
    paddingHorizontal: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7.5, color: '#94a3b8' },
  footerBrand: { fontSize: 7.5, color: COLOR.ocreLight, fontFamily: 'Helvetica-Bold' },
});

const fmt = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const dash = (v?: string | null) => (v?.trim() ? v : '—');

function OrdenCompraDocument({ d }: { d: OrdenCompraPDFData }) {
  return (
    <Document
      title={`Orden de Compra ${d.numero}`}
      author={EMPRESA_GUOR.razon_social}
      subject="Orden de compra a proveedor"
    >
      <Page size="A4" style={S.page}>
        <View style={S.headerStrip}>
          <View>
            <Text style={S.empresa}>{EMPRESA_GUOR.razon_social}</Text>
            <Text style={S.headerMeta}>
              RUC: {EMPRESA_GUOR.ruc} | {EMPRESA_GUOR.telefono} | {EMPRESA_GUOR.email}
            </Text>
            <Text style={S.headerMeta}>
              {EMPRESA_GUOR.direccion} | {EMPRESA_GUOR.web}
            </Text>
            <View style={S.badge}>
              <Text style={S.badgeText}>ORDEN DE COMPRA</Text>
            </View>
          </View>
          <View style={S.headerRight}>
            <Text style={S.docNumero}>N°: {d.numero}</Text>
            <Text style={S.docFecha}>Fecha: {d.fecha}</Text>
            <Text style={S.docFecha}>Entrega prometida: {d.fecha_prometida}</Text>
          </View>
        </View>

        <View style={S.sectionRow}>
          <View style={S.card}>
            <Text style={S.cardTitle}>Proveedor</Text>
            {(
              [
                ['Razón social', d.proveedor_nombre, true],
                ['RUC', d.proveedor_ruc],
                ['Contacto', d.proveedor_contacto],
                ['Teléfono', d.proveedor_telefono],
                ['Email', d.proveedor_email],
                ['Dirección', d.proveedor_direccion],
              ] as const
            ).map(([label, value, bold], i) => (
              <View key={i} style={S.cardRow}>
                <Text style={S.cardLabel}>{label}</Text>
                <Text style={bold ? S.cardValue : S.cardValueNormal}>{dash(value)}</Text>
              </View>
            ))}
          </View>
          <View style={S.card}>
            <Text style={S.cardTitle}>Condiciones</Text>
            {(
              [
                ['Estado OC', d.estado],
                ['Estado pago', d.estado_pago],
                ['Moneda', d.moneda],
                ['Ref. cotización', d.cotizacion_ref],
              ] as const
            ).map(([label, value], i) => (
              <View key={i} style={S.cardRow}>
                <Text style={S.cardLabel}>{label}</Text>
                <Text style={S.cardValueNormal}>{dash(value)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={S.tableWrap}>
          <View style={S.tableHead}>
            {(['#', 'Descripción', 'Tipo', 'Cant.', 'P. Unit.', 'Total'] as const).map(
              (h, i) => (
                <Text
                  key={h}
                  style={[
                    S.tableHeadCell,
                    [S.colNum, S.colDesc, S.colTipo, S.colCant, S.colPUnit, S.colTotal][i],
                  ]}
                >
                  {h}
                </Text>
              ),
            )}
          </View>
          {d.items.map((item, i) => (
            <View key={i} style={[S.tableRow, i % 2 !== 0 ? S.tableRowAlt : {}]}>
              <Text style={[S.tableCell, S.colNum]}>{item.numero}</Text>
              <Text style={[S.tableCell, S.colDesc]}>{item.descripcion}</Text>
              <Text style={[S.tableCell, S.colTipo]}>{item.tipo}</Text>
              <Text style={[S.tableCell, S.colCant]}>
                {item.cantidad.toLocaleString('es-PE')} {item.unidad}
              </Text>
              <Text style={[S.tableCell, S.colPUnit]}>{fmt(item.precio_unitario)}</Text>
              <Text style={[S.tableCellBold, S.colTotal]}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={S.totalesWrap}>
          <View style={S.totalesBox}>
            <View style={S.totalesRow}>
              <Text style={S.totalesLabel}>Subtotal</Text>
              <Text style={S.totalesValue}>{fmt(d.subtotal)}</Text>
            </View>
            <View style={S.totalFinalRow}>
              <Text style={S.totalFinalLabel}>TOTAL ORDEN</Text>
              <Text style={S.totalFinalValue}>{fmt(d.total)}</Text>
            </View>
          </View>
        </View>

        {d.notas ? (
          <View style={S.notasWrap}>
            <Text style={S.notasTitle}>Observaciones</Text>
            <Text style={S.notasText}>{d.notas}</Text>
          </View>
        ) : null}

        <View style={S.footer} fixed>
          <Text style={S.footerText}>
            {EMPRESA_GUOR.telefono} | {EMPRESA_GUOR.email} | {EMPRESA_GUOR.web}
          </Text>
          <Text style={S.footerBrand}>GUOR S.A.C.</Text>
        </View>
      </Page>
    </Document>
  );
}

export function buildOrdenCompraPDFData(orden: OrdenCompraDetalle): OrdenCompraPDFData {
  const items = (orden.ordenes_compra_items ?? []).map((item, index) => {
    const cantidad = Number(item.cantidad_pedida);
    const precio = Number(item.precio_unitario);
    const total = Number(item.subtotal ?? cantidad * precio);
    const esMaterial = item.material_id != null;
    return {
      numero: index + 1,
      descripcion:
        item.materiales?.nombre ?? item.insumo?.nombre ?? 'Ítem sin descripción',
      tipo: esMaterial ? 'Material' : 'Insumo',
      unidad: item.materiales?.unidad_medida ?? item.insumo?.unidad_medida ?? 'und',
      cantidad,
      precio_unitario: precio,
      total,
    };
  });

  const subtotal = items.reduce((acc, i) => acc + i.total, 0);

  return {
    numero: formatNumeroOc(String(orden.id)),
    fecha: orden.created_at
      ? new Date(orden.created_at).toLocaleDateString('es-PE')
      : new Date().toLocaleDateString('es-PE'),
    fecha_prometida: orden.fecha_prometida
      ? new Date(orden.fecha_prometida).toLocaleDateString('es-PE')
      : '—',
    proveedor_nombre: orden.proveedores?.razon_social ?? '—',
    proveedor_ruc: orden.proveedores?.ruc ?? '—',
    proveedor_contacto: orden.proveedores?.contacto ?? '—',
    proveedor_telefono: orden.proveedores?.telefono ?? '—',
    proveedor_email: orden.proveedores?.email ?? '—',
    proveedor_direccion: orden.proveedores?.direccion ?? '—',
    estado:
      ESTADOS_ORDEN_COMPRA[orden.estado]?.label ?? orden.estado,
    estado_pago:
      ESTADOS_PAGO_ORDEN_COMPRA[orden.estado_pago]?.label ?? orden.estado_pago,
    cotizacion_ref: orden.cotizaciones_proveedor?.numero_externo
      ? `#${orden.cotizaciones_proveedor.numero_externo}`
      : orden.cotizacion_proveedor_id
        ? `COT-${orden.cotizacion_proveedor_id}`
        : 'Manual',
    moneda: orden.cotizaciones_proveedor?.moneda ?? 'PEN',
    items,
    subtotal,
    total: Number(orden.total_orden) || subtotal,
    notas: orden.notas ?? undefined,
  };
}

export async function renderOrdenCompraPdfBuffer(
  orden: OrdenCompraDetalle,
): Promise<Buffer> {
  const data = buildOrdenCompraPDFData(orden);
  const buffer = await renderToBuffer(<OrdenCompraDocument d={data} />);
  return Buffer.from(buffer);
}
