"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#db2777' }, // Rosa GUOR
  subtitle: { fontSize: 12, color: '#666', marginTop: 5 },
  table: { display: "flex", width: "auto", marginTop: 20 },
  tableRow: { flexDirection: "row", borderBottomColor: '#EEE', borderBottomWidth: 1, padding: 8 },
  tableColHeader: { width: "25%", fontWeight: 'bold', fontSize: 10, color: '#333' },
  tableCol: { width: "25%", fontSize: 10 },
  footer: { position: 'absolute', bottom: 40, right: 40, fontSize: 14, fontWeight: 'bold', borderTop: 1, paddingTop: 10 }
});

export const SalesReportPDF = ({ data, total }: { data: any[], total: number }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Modas y Estilos GUOR</Text>
        <Text style={styles.subtitle}>Reporte de Ventas Mensual - {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Código</Text>
          <Text style={styles.tableColHeader}>Cliente</Text>
          <Text style={styles.tableColHeader}>Estado</Text>
          <Text style={styles.tableColHeader}>Monto</Text>
        </View>
        {data.map((v) => (
          <View key={v.id} style={styles.tableRow}>
            <Text style={styles.tableCol}>{v.codigo_pedido}</Text>
            <Text style={styles.tableCol}>{v.cliente?.nombre || 'Directa'}</Text>
            <Text style={styles.tableCol}>{v.estado_pedido}</Text>
            <Text style={styles.tableCol}>S/ {Number(v.total).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>TOTAL MENSUAL: S/ {total.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);