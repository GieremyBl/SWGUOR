import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

import type {
  ReporteTallerItem,
  ReporteTallerFilters,
} from '@/types/reporte-talleres';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#231e1d',
  },

  header: {
    marginBottom: 20,
    borderBottom: '2 solid #b5854b',
    paddingBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#231e1d',
  },

  subtitle: {
    marginTop: 6,
    color: '#666',
    fontSize: 10,
  },

  filters: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#fff4e2',
    borderRadius: 6,
  },

  filterText: {
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#b5854b',
  },

  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fbddd3',
    borderRadius: 8,
  },

  statLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 6,
  },

  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#b5854b',
    color: '#fff',
    fontWeight: 'bold',
  },

  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  cell: {
    padding: 8,
    fontSize: 9,
  },

  taller: {
    width: '22%',
  },

  pedido: {
    width: '18%',
  },

  cantidad: {
    width: '15%',
  },

  avance: {
    width: '15%',
  },

  fecha: {
    width: '18%',
  },

  estado: {
    width: '12%',
  },
});

interface Props {
  data: ReporteTallerItem[];
  filters?: ReporteTallerFilters;
}

export function ReporteTalleresExternosPDF({
  data,
  filters,
}: Props) {

  const totalAvance =
    data.length > 0
      ? (
          data.reduce(
            (acc, item) => acc + item.avance,
            0,
          ) / data.length
        ).toFixed(1)
      : '0';

  const totalUnidades = data.reduce(
    (acc, item) => acc + item.cantidad,
    0,
  );

  return (
    <Document>

      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>

          <Text style={styles.title}>
            Reporte de Talleres Externos
          </Text>

          <Text style={styles.subtitle}>
            GUOR · Sistema de Gestión Textil
          </Text>

          <Text style={styles.subtitle}>
            Fecha de generación: {new Date().toLocaleDateString()}
          </Text>

        </View>

        {/* FILTROS */}
        <View style={styles.filters}>

          <Text style={styles.sectionTitle}>
            Filtros Aplicados
          </Text>

          <Text style={styles.filterText}>
            Taller: {filters?.taller || 'Todos'}
          </Text>

          <Text style={styles.filterText}>
            Estado: {filters?.estado || 'Todos'}
          </Text>

          <Text style={styles.filterText}>
            Fecha Inicio: {filters?.fechaInicio || 'No especificada'}
          </Text>

          <Text style={styles.filterText}>
            Fecha Fin: {filters?.fechaFin || 'No especificada'}
          </Text>

        </View>

        {/* KPIS */}
        <View style={styles.statsContainer}>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Talleres Activos
            </Text>

            <Text style={styles.statValue}>
              {data.length}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Avance Promedio
            </Text>

            <Text style={styles.statValue}>
              {totalAvance}%
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Unidades
            </Text>

            <Text style={styles.statValue}>
              {totalUnidades}
            </Text>
          </View>

        </View>

        {/* TABLA */}
        <Text style={styles.sectionTitle}>
          Detalle de Producción
        </Text>

        <View style={styles.table}>

          <View style={styles.tableHeader}>

            <Text style={[styles.cell, styles.taller]}>
              Taller
            </Text>

            <Text style={[styles.cell, styles.pedido]}>
              Pedido
            </Text>

            <Text style={[styles.cell, styles.cantidad]}>
              Cantidad
            </Text>

            <Text style={[styles.cell, styles.avance]}>
              Avance
            </Text>

            <Text style={[styles.cell, styles.fecha]}>
              Fecha
            </Text>

            <Text style={[styles.cell, styles.estado]}>
              Estado
            </Text>

          </View>

          {data.map((item) => (
            <View
              key={item.id}
              style={styles.tableRow}
            >

              <Text style={[styles.cell, styles.taller]}>
                {item.taller}
              </Text>

              <Text style={[styles.cell, styles.pedido]}>
                {item.pedido}
              </Text>

              <Text style={[styles.cell, styles.cantidad]}>
                {item.cantidad}
              </Text>

              <Text style={[styles.cell, styles.avance]}>
                {item.avance}%
              </Text>

              <Text style={[styles.cell, styles.fecha]}>
                {item.fechaCompromiso}
              </Text>

              <Text style={[styles.cell, styles.estado]}>
                {item.estado}
              </Text>

            </View>
          ))}

        </View>

      </Page>

    </Document>
  );
}