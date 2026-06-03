import * as XLSX from "exceljs";
import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ProductoStockResumen } from '@/lib/hooks/useStockResumen';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

interface ExcelExportConfig {
  filename: string;
  sheetName?: string;
}

interface PDFExportConfig {
  filename: string;
  title: string;
  subtitle?: string;
  includeDate?: boolean;
  orientation?: 'portrait' | 'landscape';
}

interface PDFImageConfig extends PDFExportConfig {
  imageColumn?: number;
  imageKey?: string;
  imageWidth?: number;
  imageHeight?: number;
  excludeFields?: string[];
}

// Interfaces específicas para el dominio de datos
interface ProductoBase {
  id: string | number;
  sku?: string;
  nombre?: string;
  precio?: string | number;
  estado?: string;
  categorias?: { nombre?: string };
}

interface CategoriaBase {
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  created_at: string | Date;
}

interface VentaBase {
  codigo_pedido?: string;
  numero_comprobante?: string;
  orden_id?: string | number;
  created_at: string | Date;
  subtotal?: string | number;
  impuestos?: string | number;
  total?: string | number;
  estado_pedido: string;
  cliente?: { nombre?: string };
  ordenes?: {
    metodo_pago?: string;
    estado?: string;
    clientes?: { razon_social?: string };
  };
}

interface ConfeccionBase {
  id: string | number;
  cliente?: string;
  taller?: string;
  estado?: string;
  fecha_entrega?: string;
  total_prendas?: number;
  prioridad?: string;
}

interface PersonalBase {
  nombre_completo?: string;
  cargo: string;
  dni?: string;
  telefono?: string;
  estado?: boolean;
  fecha_income?: string | Date; // mapeado internamente
  fecha_ingreso?: string | Date;
  usuarios?: {
    email?: string;
    rol?: string;
    ultimo_acceso?: string | Date;
  };
}

interface ClienteBase {
  ruc?: string;
  razon_social?: string;
  nombre_comercial?: string;
  email?: string;
  telefono?: string;
  tipo_cliente?: string;
  direccion_fiscal?: string;
  activo?: boolean;
  created_at?: string | Date;
  ultimo_pedido_en?: string | Date;
  clientes?: ClienteBase; // Por compatibilidad con la estructura anidada u.clientes ?? u
  estado?: string;
  usuarios?: {
    email?: string;
    rol?: string;
    ultimo_acceso?: string | Date;
  };
}

// =====================================================
// HELPER: descarga un blob como archivo
// =====================================================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =====================================================
// HELPERS DE UTILIDAD
// =====================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
};

const drawHeaderWithLogo = async (doc: jsPDF, title: string, subtitle?: string): Promise<number> => {
  const exactBgColor = [255, 246, 228];
  const pinkGUOR = [219, 39, 119];
  const pageWidth = doc.internal.pageSize.width;

  try {
    doc.setFillColor(exactBgColor[0], exactBgColor[1], exactBgColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    const img = new Image();
    img.src = '/logo.png';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      setTimeout(() => reject(new Error('Timeout loading logo')), 1500);
    });

    doc.addImage(img, 'PNG', 14, 8, 22, 22);
    doc.setFontSize(20);
    doc.setTextColor(pinkGUOR[0], pinkGUOR[1], pinkGUOR[2]);
    doc.text(title, 42, 18);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    if (subtitle) {
      doc.text(subtitle, 42, 25);
      doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 42, 31);
    } else {
      doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 42, 25);
    }

    return 48;
  } catch {
    console.warn('No se pudo cargar el logo, generando encabezado de texto...');
    doc.setFontSize(18);
    doc.setTextColor(pinkGUOR[0], pinkGUOR[1], pinkGUOR[2]);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 28);
    return 35;
  }
};

// =====================================================
// EXPORTACIÓN A EXCEL — GENÉRICO
// =====================================================

export const exportToExcel = async (data: Record<string, unknown>[], config: ExcelExportConfig) => {
  if (data.length === 0) return;

  const workbook = new XLSX.Workbook();
  const worksheet = workbook.addWorksheet(config.sheetName ?? 'Datos');

  const keys = Object.keys(data[0]);
  worksheet.columns = keys.map(key => ({ header: key, key, width: 20 }));
  data.forEach(row => worksheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  const fecha = new Date().toISOString().split('T')[0];
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${config.filename}_${fecha}.xlsx`,
  );
};

// =====================================================
// EXPORTACIÓN A EXCEL — INVENTARIO DE PRODUCTOS
// =====================================================

export const prepareProductosForExcel = (
  productos: ProductoBase[],
  stockResumen: ProductoStockResumen[] = [],
) => {
  return productos.map(p => ({
    'SKU': p.sku ?? '---',
    'Producto': p.nombre ?? '---',
    'Categoría': p.categorias?.nombre ?? 'General',
    'Stock Real': stockResumen.find(s => s.producto_id === Number(p.id))?.stock_total_adicional ?? (typeof p.precio === 'number' ? p.precio : 0), 
    'Precio (S/.)': Number(p.precio ?? 0).toFixed(2),
    'Estado': p.estado === 'activo' ? 'Activo' : 'Inactivo',
  }));
};

export const exportProductosToExcel = async (
  productos: ProductoBase[],
  stockResumen: ProductoStockResumen[] = [],
  filename: string,
) => {
  const data = prepareProductosForExcel(productos, stockResumen);
  await exportToExcel(data as unknown as Record<string, unknown>[], { filename, sheetName: 'Inventario' });
};

// =====================================================
// EXPORTACIÓN A PDF — SIMPLE (jsPDF + autoTable)
// =====================================================

export const exportToPDF = async (
  headers: string[][],
  body: string[][],
  config: PDFExportConfig,
) => {
  const doc = new jsPDF({ orientation: config.orientation ?? 'portrait' });
  const startY = await drawHeaderWithLogo(doc, config.title, config.subtitle);

  autoTable(doc, {
    head: headers,
    body,
    startY,
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [219, 39, 119], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    rowPageBreak: 'auto',
    showHead: 'everyPage',
    margin: { top: 40, bottom: 20 },
  } as UserOptions);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `GUOR S.A.C. - Página ${i} de ${totalPages}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' },
    );
  }

  doc.save(`${config.filename}.pdf`);
};

// =====================================================
// ESTILOS COMPARTIDOS (@react-pdf/renderer)
// =====================================================

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF6E4', padding: 15, marginBottom: 20, borderRadius: 5 },
  headerText: { flexDirection: 'column' },
  title: { fontSize: 18, color: '#db2777', fontWeight: 'bold' },
  subtitle: { fontSize: 10, color: '#555', marginTop: 3 },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderBottomWidth: 0, borderRightWidth: 0 },
  tableRow: { flexDirection: 'row' },
  tableRowStriped: { flexDirection: 'row', backgroundColor: '#f9fafb' },
  tableColHeader: { borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#db2777', padding: 6 },
  tableCol: { borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderLeftWidth: 0, borderTopWidth: 0, padding: 6, justifyContent: 'center' },
  tableCellHeader: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  tableCell: { fontSize: 8, color: '#333' },
  badgeAgotado: { fontSize: 7, color: '#dc2626', backgroundColor: '#fef2f2', padding: 2, borderRadius: 3 },
  badgeBajo: { fontSize: 7, color: '#d97706', backgroundColor: '#fffbeb', padding: 2, borderRadius: 3 },
  badgeDisp: { fontSize: 7, color: '#16a34a', backgroundColor: '#f0fdf4', padding: 2, borderRadius: 3 },
});

// =====================================================
// EXPORTACIÓN A PDF — CATEGORÍAS (@react-pdf/renderer)
// =====================================================

interface DocumentProps<T> {
  data: T[];
  config: { title: string; filename: string };
}

const CategoriasDocument = ({ data, config }: DocumentProps<CategoriaBase>) => {
  const colWidths = ['25%', '40%', '15%', '20%'];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>Directorio Oficial - Modas y Estilos GUOR</Text>
            <Text style={styles.subtitle}>Generado: {new Date().toLocaleString('es-PE')}</Text>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {['CATEGORÍA', 'DESCRIPCIÓN', 'ESTADO', 'CREACIÓN'].map((header, i) => (
              <View key={i} style={[styles.tableColHeader, { width: colWidths[i] }]}>
                <Text style={styles.tableCellHeader}>{header}</Text>
              </View>
            ))}
          </View>
          {data.map((item, rowIndex) => (
            <View key={rowIndex} style={rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowStriped}>
              <View style={[styles.tableCol, { width: colWidths[0] }]}><Text style={styles.tableCell}>{item.nombre ?? '---'}</Text></View>
              <View style={[styles.tableCol, { width: colWidths[1] }]}><Text style={styles.tableCell}>{item.descripcion ?? 'Sin descripción'}</Text></View>
              <View style={[styles.tableCol, { width: colWidths[2] }]}><Text style={styles.tableCell}>{item.activo ? 'Activa' : 'Inactiva'}</Text></View>
              <View style={[styles.tableCol, { width: colWidths[3] }]}><Text style={styles.tableCell}>{new Date(item.created_at).toLocaleDateString()}</Text></View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export const exportCategoriasToPDF = async (data: CategoriaBase[], config: { title: string; filename: string }) => {
  if (!data || data.length === 0) return;
  if (typeof window === 'undefined') return;

  const asPdf = pdf();
  asPdf.updateContainer(<CategoriasDocument data={data} config={config} />);
  const blob = await asPdf.toBlob();
  downloadBlob(blob, `${config.filename}.pdf`);
};

// =====================================================
// EXPORTACIÓN A PDF — INVENTARIO (@react-pdf/renderer)
// =====================================================

interface InventarioDocumentProps {
  data: (ProductoBase & { categoria_id?: string | number; stock?: number })[];
  categorias: { id: string | number; nombre: string }[];
  config: PDFExportConfig;
}

const InventarioDocument = ({ data, categorias, config }: InventarioDocumentProps) => {
  const colWidths = ['15%', '35%', '20%', '10%', '10%', '10%'];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>Modas y Estilos GUOR</Text>
            <Text style={styles.subtitle}>Generado: {new Date().toLocaleString('es-PE')}</Text>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {['SKU', 'PRODUCTO', 'CATEGORÍA', 'STOCK', 'PRECIO', 'ESTADO'].map((header, i) => (
              <View key={i} style={[styles.tableColHeader, { width: colWidths[i] }]}>
                <Text style={styles.tableCellHeader}>{header}</Text>
              </View>
            ))}
          </View>
          {data.map((item, rowIndex) => {
            const cat = categorias.find(
              (c) => String(c.id).replace(/\D/g, '') === String(item.categoria_id).replace(/\D/g, ''),
            )?.nombre ?? 'General';
            const stockVal = Number(item.stock ?? 0);
            const estLabel = stockVal === 0 ? 'Agotado' : stockVal <= 5 ? 'Bajo' : 'Disponible';
            const estStyle = stockVal === 0 ? styles.badgeAgotado : stockVal <= 5 ? styles.badgeBajo : styles.badgeDisp;
            return (
              <View key={rowIndex} style={rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowStriped}>
                <View style={[styles.tableCol, { width: colWidths[0] }]}><Text style={styles.tableCell}>{item.sku ?? '---'}</Text></View>
                <View style={[styles.tableCol, { width: colWidths[1] }]}><Text style={styles.tableCell}>{item.nombre ?? '---'}</Text></View>
                <View style={[styles.tableCol, { width: colWidths[2] }]}><Text style={styles.tableCell}>{cat}</Text></View>
                <View style={[styles.tableCol, { width: colWidths[3] }]}><Text style={styles.tableCell}>{stockVal}</Text></View>
                <View style={[styles.tableCol, { width: colWidths[4] }]}><Text style={styles.tableCell}>{`S/ ${Number(item.precio ?? 0).toFixed(2)}`}</Text></View>
                <View style={[styles.tableCol, { width: colWidths[5] }]}><Text style={estStyle}>{estLabel}</Text></View>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

export const exportInventarioToPDF = async (
  data: (ProductoBase & { categoria_id?: string | number; stock?: number })[], 
  categorias: { id: string | number; nombre: string }[], 
  config: PDFExportConfig
) => {
  if (!data || data.length === 0) return;
  if (typeof window === 'undefined') return;

  const asPdf = pdf();
  asPdf.updateContainer(<InventarioDocument data={data} categorias={categorias} config={config} />);
  const blob = await asPdf.toBlob();
  downloadBlob(blob, `${config.filename}.pdf`);
};

// =====================================================
// EXPORTACIÓN A PDF — CON IMÁGENES (CATÁLOGO)
// =====================================================

export const exportToPDFWithImages = async (data: Record<string, unknown>[], config: PDFImageConfig) => {
  if (data.length === 0) return;

  const doc = new jsPDF({ orientation: config.orientation ?? 'portrait' });
  const startY = await drawHeaderWithLogo(doc, config.title, config.subtitle);
  const imageKey = config.imageKey ?? 'imagen';
  const excludeFields = config.excludeFields ?? ['id', 'created_at'];

  const getImageData = (imageUrl: string): Promise<string> => {
    return new Promise(resolve => {
      if (!imageUrl) return resolve('NO_IMAGE');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 100;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => resolve('NO_IMAGE');
      setTimeout(() => resolve('NO_IMAGE'), 2000);
    });
  };

  const displayKeys = Object.keys(data[0]).filter(key => !excludeFields.includes(key));
  const tableRows = await Promise.all(
    data.map(item =>
      Promise.all(
        displayKeys.map(key => (key === imageKey ? getImageData(item[key] as string) : String(item[key] ?? '-'))),
      ),
    ),
  );
  const headers = displayKeys.map(key =>
    key === imageKey ? 'Imagen' : key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
  );
  const imageColIndex = displayKeys.indexOf(imageKey);

  autoTable(doc, {
    head: [headers],
    body: tableRows,
    startY: startY + 5,
    styles: { valign: 'middle', fontSize: 8 },
    columnStyles: { [imageColIndex]: { cellWidth: 30, fontSize: 0.1, textColor: [255, 246, 228] } },
    headStyles: { fillColor: [219, 39, 119] },
    didDrawCell: (cellData) => {
      if (cellData.column.index === imageColIndex && cellData.cell.section === 'body') {
        const imgRaw = cellData.cell.raw as string;
        if (imgRaw?.startsWith('data:image')) {
          doc.addImage(imgRaw, 'JPEG', cellData.cell.x + 5, cellData.cell.y + 2, 20, 20);
        }
      }
    },
    didParseCell: (cellData) => {
      if (cellData.section === 'body') cellData.row.height = 25;
    },
  } as UserOptions);

  doc.save(`${config.filename}.pdf`);
};

// =====================================================
// HELPERS ESPECÍFICOS DE PREPARACIÓN
// =====================================================

export const exportProductosToPDFWithImages = async (productos: (ProductoBase & { imagen_url?: string; stock?: number })[]) => {
  const productosFiltrados = productos.filter(p => Number(p.stock) > 400);
  if (productosFiltrados.length === 0) {
    throw new Error('No hay productos con stock superior a 400 unidades.');
  }
  const data = productosFiltrados.map(p => ({
    imagen: p.imagen_url,
    sku: p.sku,
    nombre: p.nombre,
    categoria: p.categorias?.nombre ?? 'General',
    precio: formatCurrency(Number(p.precio)),
    stock: String(p.stock),
  }));
  await exportToPDFWithImages(data, {
    filename: 'Catalogo_Productos_GUOR',
    title: 'CATÁLOGO DE PRODUCTOS',
    subtitle: 'Inventario oficial Modas y Estilos GUOR',
    imageKey: 'imagen',
  });
};

export const prepareVentasForPDF = (ventas: VentaBase[]) => {
  const headers = [['CÓDIGO', 'CLIENTE', 'FECHA', 'ESTADO', 'TOTAL']];
  const body = ventas.map(v => [
    v.codigo_pedido ?? '---',
    v.cliente?.nombre ?? 'Público General',
    new Date(v.created_at).toLocaleDateString('es-PE'),
    v.estado_pedido.toUpperCase(),
    formatCurrency(Number(v.total ?? 0)),
  ]);
  return { headers, body };
};

export const prepareVentasForExcel = (ventas: VentaBase[]) => {
  return ventas.map(v => ({
    'Código': v.codigo_pedido ?? '---',
    'Cliente': v.cliente?.nombre ?? 'Público General',
    'Fecha': new Date(v.created_at).toLocaleDateString('es-PE'),
    'Subtotal': Number(v.subtotal ?? 0),
    'Total': Number(v.total ?? 0),
    'Estado': v.estado_pedido.toUpperCase(),
  }));
};

export const prepareCategoriasForExcel = (categorias: CategoriaBase[]) => {
  return categorias.map(c => ({
    'Nombre de Categoría': c.nombre,
    'Descripción': c.descripcion ?? 'Sin descripción',
    'Estado': c.activo ? 'Activo' : 'Inactivo',
    'Fecha de Creación': new Date(c.created_at).toLocaleDateString('es-PE'),
  }));
};

export const exportVentasDetailedPDF = async (ventas: VentaBase[], config: PDFExportConfig) => {
  if (ventas.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const startY = await drawHeaderWithLogo(doc, config.title, config.subtitle);

  let totalRecaudado = 0;
  let totalImpuestos = 0;
  const metodosPago: Record<string, number> = {};

  const body = ventas.map(v => {
    const total = Number(v.total) || 0;
    const impuesto = Number(v.impuestos) || 0;
    const subtotal = Number(v.subtotal) || (total - impuesto);
    const metodo = (v.ordenes?.metodo_pago ?? 'Efectivo').toUpperCase();
    totalRecaudado += total;
    totalImpuestos += impuesto;
    metodosPago[metodo] = (metodosPago[metodo] ?? 0) + total;
    return [
      v.numero_comprobante ?? `ORD-${v.orden_id}`,
      v.ordenes?.clientes?.razon_social ?? 'PÚBLICO GENERAL',
      new Date(v.created_at).toLocaleDateString('es-PE'),
      metodo,
      v.ordenes?.estado?.toUpperCase() ?? 'PAGADO',
      formatCurrency(subtotal),
      formatCurrency(impuesto),
      formatCurrency(total),
    ];
  });

  autoTable(doc, {
    head: [['COMPROBANTE', 'CLIENTE', 'FECHA', 'MÉTODO', 'ESTADO', 'SUBTOTAL', 'IGV', 'TOTAL']],
    body,
    startY,
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', halign: 'center' },
    headStyles: { fillColor: [219, 39, 119], textColor: 255 },
    columnStyles: { 1: { halign: 'left', cellWidth: 'auto' }, 7: { halign: 'right', fontStyle: 'bold' } },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 14, right: 14 },
  } as UserOptions);

  const finalY = (doc as jsPDFWithAutoTable).lastAutoTable?.finalY ?? (startY + 20);
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(pageWidth - 85, finalY, 70, 40, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('RESUMEN DE CAJA', pageWidth - 80, finalY + 8);
  doc.setFontSize(8);
  doc.text('Total Bruto:', pageWidth - 80, finalY + 18);
  doc.text(formatCurrency(totalRecaudado - totalImpuestos), pageWidth - 30, finalY + 18, { align: 'right' });
  doc.text('Total Impuestos:', pageWidth - 80, finalY + 24);
  doc.text(formatCurrency(totalImpuestos), pageWidth - 30, finalY + 24, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor(219, 39, 119);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL NETO:', pageWidth - 80, finalY + 34);
  doc.text(formatCurrency(totalRecaudado), pageWidth - 30, finalY + 34, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.setFontSize(8);
  let metodoY = finalY + 8;
  doc.text('DESGLOSE POR MÉTODO:', margin, metodoY);
  Object.entries(metodosPago).forEach(([metodo, monto]) => {
    metodoY += 6;
    doc.text(`${metodo}: ${formatCurrency(monto)}`, margin + 2, metodoY);
  });

  doc.save(`${config.filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// =====================================================
// HELPERS ESPECÍFICOS PARA CONFECCIONES
// =====================================================

export const prepareConfeccionesForExcel = (data: ConfeccionBase[]) => {
  return data.map(c => ({
    'ID Orden': c.id,
    'Cliente': c.cliente ?? 'Sin Cliente',
    'Taller/Proveedor': c.taller ?? 'Taller Interno',
    'Estado': (c.estado ?? 'Pendiente').toUpperCase().replace('_', ' '),
    'Fecha de Entrega': c.fecha_entrega ?? 'No definida',
    'Prendas Totales': c.total_prendas ?? 0,
    'Prioridad': c.prioridad ?? 'Normal',
  }));
};

export const prepareConfeccionesForPDF = (data: ConfeccionBase[]) => {
  const headers = [['ORDEN', 'CLIENTE', 'TALLER', 'ESTADO', 'ENTREGA', 'CANT.']];
  const body = data.map(c => [
    `#${c.id}`,
    c.cliente ?? 'N/A',
    c.taller ?? 'Interno',
    (c.estado ?? 'Pendiente').toUpperCase(),
    c.fecha_entrega ?? 'Pnd.',
    String(c.total_prendas ?? 0),
  ]);
  return { headers, body };
};

export const exportConfeccionesDetailedPDF = async (data: ConfeccionBase[], config: PDFExportConfig) => {
  if (!data || data.length === 0) return;

  const doc = new jsPDF({ orientation: config.orientation ?? 'portrait', unit: 'mm', format: 'a4' });
  const startY = await drawHeaderWithLogo(doc, config.title, config.subtitle);

  const stats = {
    total: data.length,
    prendas: data.reduce((acc, curr) => acc + (Number(curr.total_prendas) || 0), 0),
    enProceso: data.filter(c => c.estado && ['cortando', 'confeccionando', 'escalado'].includes(c.estado)).length,
  };

  const { headers, body } = prepareConfeccionesForPDF(data);

  autoTable(doc, {
    head: headers,
    body,
    startY,
    styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
    headStyles: { fillColor: [219, 39, 119], textColor: 255 },
    columnStyles: { 1: { halign: 'left', cellWidth: 'auto' }, 2: { halign: 'left' } },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  } as UserOptions);

  const finalY = (doc as jsPDFWithAutoTable).lastAutoTable?.finalY ?? (startY + 20);
  const pageWidth = doc.internal.pageSize.width;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, finalY, pageWidth - 28, 25, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('RESUMEN OPERATIVO DE TALLERES', 20, finalY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Total Órdenes: ${stats.total}`, 20, finalY + 17);
  doc.text(`Total Prendas a Confeccionar: ${stats.prendas}`, 70, finalY + 17);
  doc.text(`Órdenes en Proceso Activo: ${stats.enProceso}`, 130, finalY + 17);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `MODAS Y ESTILOS GUOR - Sistema de Producción - Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' },
    );
  }

  doc.save(`${config.filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// =====================================================
// EXPORTACIÓN A PDF — COTIZACIONES (@react-pdf/renderer)
// =====================================================

interface CotizacionDocData {
  cotizacion_id?: string | number;
  cliente?: string;
  monto?: number;
  estado?: string;
  fecha_vencimiento?: string;
  descripcion?: string;
}

const CotizacionesDocument = ({ data, config }: DocumentProps<CotizacionDocData>) => {
  const colWidths = ['18%', '22%', '15%', '12%', '13%', '20%'];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>Reporte Comercial - Modas y Estilos GUOR</Text>
            <Text style={styles.subtitle}>Generado: {new Date().toLocaleString('es-PE')}</Text>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {['N° COT.', 'CLIENTE', 'MONTO', 'ESTADO', 'VENCIMIENTO', 'DESCRIPCIÓN'].map((header, i) => (
              <View key={i} style={[styles.tableColHeader, { width: colWidths[i] }]}>
                <Text style={styles.tableCellHeader}>{header}</Text>
              </View>
            ))}
          </View>
          {data.map((item, rowIndex) => (
            <View key={rowIndex} style={rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowStriped}>
              <View style={[styles.tableCol, { width: colWidths[0] }]}><Text style={styles.tableCell}>{item.cotizacion_id ?? '---'}</Text></View>
              <View style={[styles.tableCol, { width: colWidths[1] }]}><Text style={styles.tableCell}>{item.cliente ?? 'Sin cliente'}</Text></View>
              <View style={[styles.tableCol, { width: colWidths[2] }]}><Text style={styles.tableCell}>{`S/ ${Number(item.monto ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}</Text></View>
              <View style={[styles.tableCol, { width: colWidths[3] }]}><Text style={styles.tableCell}>{(item.estado ?? 'borrador').toUpperCase()}</Text></View>
              <View style={[styles.tableCol, { width: colWidths[4] }]}><Text style={styles.tableCell}>{item.fecha_vencimiento ?? '---'}</Text></View>
              <View style={[styles.tableCol, { width: colWidths[5] }]}><Text style={styles.tableCell}>{item.descripcion ?? '---'}</Text></View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export const exportCotizacionesToPDF = async (data: CotizacionDocData[], config: { title: string; filename: string }) => {
  if (!data || data.length === 0) return;
  if (typeof window === 'undefined') return;

  const asPdf = pdf();
  asPdf.updateContainer(<CotizacionesDocument data={data} config={config} />);
  const blob = await asPdf.toBlob();
  downloadBlob(blob, `${config.filename}.pdf`);
};

// =====================================================
// EXPORTACIÓN PERSONAL — EXCEL
// =====================================================

const CARGO_LABELS_MAP: Record<string, string> = {
  gerente: 'Gerente',
  disenador: 'Diseñador',
  cortador: 'Cortador',
  recepcionista: 'Recepcionista',
  administrador: 'Administrador',
  ayudante: 'Ayudante',
  representante_taller: 'Rep. de Taller',
};

export interface PersonalExportInput {
  nombre_completo?: string | null;
  cargo?: string | null;
  dni?: string | null;
  telefono?: string | number | null;
  estado?: string | boolean | null;
  fecha_ingreso?: string | Date | null;
  usuarios?: {
    email?: string | null;
    rol?: string | null;
    ultimo_acceso?: string | Date | null;
  } | null;
}

export const exportPersonalToExcel = async (
  data: PersonalExportInput[], 
  config?: { filename?: string }
) => {
  if (!data || data.length === 0) return;

  const rows = data.map(p => {
    // 1. Procesamiento seguro del Cargo buscando en tu mapa de etiquetas
    const cargoKey = p.cargo ?? '';
    const cargoLabel = cargoKey && typeof CARGO_LABELS_MAP !== 'undefined'
      ? (CARGO_LABELS_MAP as Record<string, string>)[cargoKey] ?? cargoKey
      : cargoKey;

    // 2. Procesamiento semántico del Estado (por si viene como String o Boolean)
    let estadoLabel = 'INACTIVO';
    if (p.estado === 'activo' || p.estado === true) {
      estadoLabel = 'ACTIVO';
    } else if (p.estado === 'suspendido') {
      estadoLabel = 'SUSPENDIDO';
    } else if (p.estado) {
      estadoLabel = String(p.estado).toUpperCase();
    }

    return {
      'NOMBRE COMPLETO': p.nombre_completo || '—',
      'CARGO': cargoLabel || '—',
      'DNI': p.dni || '—',
      'TELÉFONO': p.telefono || '—',
      'EMAIL': p.usuarios?.email || '—',
      'ROL SISTEMA': p.usuarios?.rol || '—',
      'ESTADO': estadoLabel,
      'FECHA INGRESO': p.fecha_ingreso ? new Date(p.fecha_ingreso).toLocaleDateString('es-PE') : '—',
      'ÚLTIMO ACCESO': p.usuarios?.ultimo_acceso ? new Date(p.usuarios.ultimo_acceso).toLocaleDateString('es-PE') : '—',
    };
  });

  await exportToExcel(rows as Record<string, unknown>[], {
    filename: config?.filename ?? `Personal_GUOR_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Personal Interno',
  });
};

// =====================================================
// EXPORTACIÓN PERSONAL — PDF
// =====================================================

export const exportPersonalToPDF = async (data: PersonalBase[], config?: { filename?: string }) => {
  if (!data || data.length === 0) return;
  const headers = [['NOMBRE', 'CARGO', 'DNI', 'TELÉFONO', 'EMAIL', 'ESTADO']];
  const body = data.map(p => [
    p.nombre_completo ?? '—',
    p.cargo ? (CARGO_LABELS_MAP[p.cargo] ?? p.cargo) : '—',
    p.dni ?? '—',
    p.telefono ?? '—',
    p.usuarios?.email ?? '—',
    p.estado !== false ? 'ACTIVO' : 'INACTIVO',
  ]);
  await exportToPDF(headers, body, {
    title: 'REPORTE DE PERSONAL INTERNO',
    subtitle: 'Modas y Estilos GUOR S.A.C.',
    filename: config?.filename ?? `Personal_GUOR_${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
  });
};

// =====================================================
// EXPORTACIÓN CLIENTES — EXCEL
// =====================================================

export const exportClientesToExcel = async (data: ClienteBase[], config?: { filename?: string }) => {
  if (!data || data.length === 0) return;
  const rows = data.map(u => {
    const c = u.clientes ?? u;
    return {
      'RUC': c.ruc ?? '—',
      'RAZÓN SOCIAL': c.razon_social ?? '—',
      'NOMBRE COMERCIAL': c.nombre_comercial ?? '—',
      'EMAIL': u.email ?? c.email ?? '—',
      'TELÉFONO': c.telefono ?? '—',
      'TIPO': String(c.tipo_cliente ?? '—').toUpperCase(),
      'DIRECCIÓN FISCAL': c.direccion_fiscal ?? '—',
      'ESTADO': String(u.estado ?? (c.activo ? 'ACTIVO' : 'INACTIVO')).toUpperCase(),
      'REGISTRADO': c.created_at ? new Date(c.created_at).toLocaleDateString('es-PE') : '—',
      'ÚLTIMO ACCESO': u.usuarios?.ultimo_acceso ? new Date(u.usuarios.ultimo_acceso).toLocaleDateString('es-PE') : '—',
    };
  });
  await exportToExcel(rows as unknown as Record<string, unknown>[], {
    filename: config?.filename ?? `Clientes_GUOR_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Clientes',
  });
};

// =====================================================
// EXPORTACIÓN CLIENTES — PDF
// =====================================================

export const exportClientesToPDF = async (data: ClienteBase[], config?: { filename?: string }) => {
  if (!data || data.length === 0) return;
  const headers = [['RUC', 'RAZÓN SOCIAL', 'EMAIL', 'TELÉFONO', 'TIPO', 'ESTADO']];
  const body = data.map(u => {
    const c = u.clientes ?? u;
    return [
      c.ruc ?? '—',
      c.razon_social ?? '—',
      u.email ?? c.email ?? '—',
      c.telefono ?? '—',
      String(c.tipo_cliente ?? '—').toUpperCase(),
      String(u.estado ?? (c.activo ? 'ACTIVO' : 'INACTIVO')).toUpperCase(),
    ];
  });
  await exportToPDF(headers, body, {
    title: 'DIRECTORIO DE CLIENTES',
    subtitle: 'Modas y Estilos GUOR S.A.C.',
    filename: config?.filename ?? `Clientes_GUOR_${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
  });
};

// =====================================================
// EXPORTACIÓN CLIENTES (ClienteListItem) — EXCEL
// =====================================================

export const exportClientesListToExcel = async (data: ClienteBase[], config?: { filename?: string }) => {
  if (!data || data.length === 0) return;
  const rows = data.map(c => ({
    'RUC': c.ruc ?? '—',
    'RAZÓN SOCIAL': c.razon_social ?? '—',
    'NOMBRE COMERCIAL': c.nombre_comercial ?? '—',
    'EMAIL': c.email ?? c.usuarios?.email ?? '—',
    'TELÉFONO': c.telefono ?? '—',
    'TIPO CLIENTE': String(c.tipo_cliente ?? '—').toUpperCase(),
    'DIRECCIÓN FISCAL': c.direccion_fiscal ?? '—',
    'ESTADO': String(c.activo ?? '—').toUpperCase(),
    'ROL SISTEMA': c.usuarios?.rol ?? '—',
    'ÚLTIMO PEDIDO': c.ultimo_pedido_en ? new Date(c.ultimo_pedido_en).toLocaleDateString('es-PE') : 'Sin pedidos',
    'ÚLTIMO ACCESO': c.usuarios?.ultimo_acceso ? new Date(c.usuarios.ultimo_acceso).toLocaleDateString('es-PE') : '—',
  }));
  await exportToExcel(rows as unknown as Record<string, unknown>[], {
    filename: config?.filename ?? `Clientes_GUOR_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Clientes',
  });
};

// =====================================================
// EXPORTACIÓN CLIENTES (ClienteListItem) — PDF
// =====================================================

export const exportClientesListToPDF = async (data: ClienteBase[], config?: { filename?: string }) => {
  if (!data || data.length === 0) return;
  const headers = [['RUC', 'RAZÓN SOCIAL', 'EMAIL', 'TELÉFONO', 'TIPO', 'ESTADO', 'ÚLTIMO PEDIDO']];
  const body = data.map(c => [
    c.ruc ?? '—',
    c.razon_social ?? '—',
    c.email ?? c.usuarios?.email ?? '—',
    c.telefono ?? '—',
    String(c.tipo_cliente ?? '—').toUpperCase(),
    String(c.activo ?? '—').toUpperCase(),
    c.ultimo_pedido_en ? new Date(c.ultimo_pedido_en).toLocaleDateString('es-PE') : 'Sin pedidos',
  ]);
  await exportToPDF(headers, body, {
    title: 'DIRECTORIO DE CLIENTES',
    subtitle: 'Modas y Estilos GUOR S.A.C.',
    filename: config?.filename ?? `Clientes_GUOR_${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
  });
};

// =====================================================
// COTIZACIÓN INDIVIDUAL — TIPOS Y ESTILOS
// =====================================================

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

export interface CotizacionItemPDF {
  numero: number;
  descripcion: string;
  talla: string;
  color: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

export interface CotizacionPDFData {
  numero: string;
  fecha: string;
  valido_hasta: string;
  cliente_nombre: string;
  cliente_ruc?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  cliente_direccion?: string;
  moneda: string;
  items: CotizacionItemPDF[];
  subtotal: number;
  descuento_pct?: number;
  descuento_monto?: number;
  costo_envio?: number;
  igv: number;
  total: number;
  notas?: string;
  zona_envio?: string;
}

const S = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: COLOR.texto, paddingTop: 0, paddingBottom: 36, paddingHorizontal: 0 },
  headerStrip: { backgroundColor: COLOR.ocreLight, paddingHorizontal: 36, paddingVertical: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderBottomWidth: 3, borderBottomColor: COLOR.ocre },
  headerLeft: { flexDirection: 'column', gap: 3 },
  empresa: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLOR.negro, letterSpacing: 0.5 },
  headerMeta: { fontSize: 8, color: COLOR.gris, marginTop: 2 },
  badgeCot: { backgroundColor: COLOR.ocre, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  badgeCotText: { color: COLOR.blanco, fontFamily: 'Helvetica-Bold', fontSize: 11, letterSpacing: 1 },
  headerRight: { alignItems: 'flex-end', gap: 3 },
  cotNumero: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLOR.negro },
  cotFecha: { fontSize: 8, color: COLOR.gris },
  sectionRow: { flexDirection: 'row', paddingHorizontal: 36, marginTop: 18, gap: 14 },
  card: { flex: 1, borderWidth: 1, borderColor: COLOR.linea, borderRadius: 6, padding: 12, backgroundColor: COLOR.blanco },
  cardTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLOR.ocre, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7, borderBottomWidth: 1, borderBottomColor: COLOR.ocreLight, paddingBottom: 4 },
  cardRow: { flexDirection: 'row', marginBottom: 3 },
  cardLabel: { fontSize: 8, color: COLOR.gris, width: 68 },
  cardValue: { fontSize: 8, color: COLOR.texto, fontFamily: 'Helvetica-Bold', flex: 1 },
  cardValueNormal: { fontSize: 8, color: COLOR.texto, flex: 1 },
  tableWrap: { marginHorizontal: 36, marginTop: 18, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: COLOR.linea },
  tableHead: { flexDirection: 'row', backgroundColor: COLOR.negro, paddingVertical: 7, paddingHorizontal: 8 },
  tableHeadCell: { color: COLOR.blanco, fontFamily: 'Helvetica-Bold', fontSize: 7.5, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: COLOR.linea },
  tableRowAlt: { backgroundColor: COLOR.ocreLight },
  tableCell: { fontSize: 8, color: COLOR.texto },
  tableCellBold: { fontSize: 8, color: COLOR.texto, fontFamily: 'Helvetica-Bold' },
  colNum: { width: '5%' },
  colDesc: { width: '36%' },
  colTalla: { width: '10%' },
  colColor: { width: '13%' },
  colCant: { width: '10%', textAlign: 'right' },
  colPUnit: { width: '13%', textAlign: 'right' },
  colTotal: { width: '13%', textAlign: 'right' },
  totalesWrap: { marginHorizontal: 36, marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end' },
  totalesBox: { width: 220, borderWidth: 1, borderColor: COLOR.linea, borderRadius: 6, overflow: 'hidden' },
  totalesRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLOR.linea },
  totalesLabel: { fontSize: 8, color: COLOR.gris },
  totalesValue: { fontSize: 8, color: COLOR.texto, fontFamily: 'Helvetica-Bold' },
  totalesDiscount: { color: '#16a34a' },
  totalFinalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLOR.negro },
  totalFinalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLOR.blanco },
  totalFinalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLOR.ocreLight },
  notasWrap: { marginHorizontal: 36, marginTop: 16, padding: 10, backgroundColor: COLOR.ocreLight, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: COLOR.ocre },
  notasTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLOR.ocreDark, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  notasBullet: { fontSize: 8, color: COLOR.gris, marginBottom: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLOR.negro, paddingVertical: 9, paddingHorizontal: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 7.5, color: '#94a3b8' },
  footerBrand: { fontSize: 7.5, color: COLOR.ocreLight, fontFamily: 'Helvetica-Bold' },
});

const fmt = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const dash = (v?: string | null) => v ?? '—';

const CotizacionDocument = ({ d }: { d: CotizacionPDFData }) => (
  <Document title={`Cotización ${d.numero}`} author="Modas y Estilos GUOR S.A.C." subject="Cotización comercial">
    <Page size="A4" style={S.page}>
      <View style={S.headerStrip}>
        <View style={S.headerLeft}>
          <Text style={S.empresa}>MODAS Y ESTILOS GUOR S.A.C.</Text>
          <Text style={S.headerMeta}>RUC: 20555924624  |  +51 908 801 912  |  modasyestilosguor@gmail.com</Text>
          <Text style={S.headerMeta}>Rio Sta. Fe 590, Lima 15434, Perú  |  www.modas-y-estilos-guor.pe</Text>
          <View style={S.badgeCot}><Text style={S.badgeCotText}>COTIZACIÓN</Text></View>
        </View>
        <View style={S.headerRight}>
          <Text style={S.cotNumero}>N°: {d.numero}</Text>
          <Text style={S.cotFecha}>Fecha: {d.fecha}</Text>
          <Text style={S.cotFecha}>Válido hasta: {d.valido_hasta}</Text>
        </View>
      </View>

      <View style={S.sectionRow}>
        <View style={S.card}>
          <Text style={S.cardTitle}>Datos del Cliente</Text>
          {[
            ['Cliente', d.cliente_nombre, true], 
            ['RUC', d.cliente_ruc], 
            ['Tel', d.cliente_telefono], 
            ['Email', d.cliente_email], 
            ['Dir', d.cliente_direccion]
          ].map(([label, value, bold], i) => (
            <View key={i} style={S.cardRow}>
              <Text style={S.cardLabel}>{String(label)}</Text>
              <Text style={bold ? S.cardValue : S.cardValueNormal}>{dash(value as string)}</Text>
            </View>
          ))}
        </View>
        <View style={S.card}>
          <Text style={S.cardTitle}>Condiciones</Text>
          {[
            ['Moneda', d.moneda], 
            ['Vigencia', '7 días calendario'], 
            ['IGV', '18% incluido'], 
            ['Envío', d.zona_envio], 
            ['Forma de pago', 'A convenir']
          ].map(([label, value], i) => (
            <View key={i} style={S.cardRow}>
              <Text style={S.cardLabel}>{label}</Text>
              <Text style={S.cardValueNormal}>{dash(value as string)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={S.tableWrap}>
        <View style={S.tableHead}>
          {(['#', 'Descripción', 'Talla', 'Color', 'Cant.', 'P. Unit.', 'Total'] as const).map((h, i) => (
            <Text key={i} style={[S.tableHeadCell, [S.colNum, S.colDesc, S.colTalla, S.colColor, S.colCant, S.colPUnit, S.colTotal][i]]}>{h}</Text>
          ))}
        </View>
        {d.items.map((item, i) => (
          <View key={i} style={[S.tableRow, i % 2 !== 0 ? S.tableRowAlt : {}]}>
            <Text style={[S.tableCell, S.colNum]}>{item.numero}</Text>
            <Text style={[S.tableCell, S.colDesc]}>{item.descripcion}</Text>
            <Text style={[S.tableCell, S.colTalla]}>{item.talla}</Text>
            <Text style={[S.tableCell, S.colColor]}>{item.color}</Text>
            <Text style={[S.tableCell, S.colCant]}>{item.cantidad.toLocaleString()}</Text>
            <Text style={[S.tableCell, S.colPUnit]}>{fmt(item.precio_unitario)}</Text>
            <Text style={[S.tableCellBold, S.colTotal]}>{fmt(item.total)}</Text>
          </View>
        ))}
      </View>

      <View style={S.totalesWrap}>
        <View style={S.totalesBox}>
          <View style={S.totalesRow}><Text style={S.totalesLabel}>Subtotal</Text><Text style={S.totalesValue}>{fmt(d.subtotal)}</Text></View>
          {!!d.descuento_monto && d.descuento_monto > 0 && (
            <View style={S.totalesRow}>
              <Text style={S.totalesLabel}>Descuento {d.descuento_pct ? `${d.descuento_pct}%` : ''}</Text>
              <Text style={[S.totalesValue, S.totalesDiscount]}>− {fmt(d.descuento_monto)}</Text>
            </View>
          )}
          {!!d.costo_envio && d.costo_envio > 0 && (
            <View style={S.totalesRow}><Text style={S.totalesLabel}>Envío</Text><Text style={S.totalesValue}>{fmt(d.costo_envio)}</Text></View>
          )}
          <View style={S.totalesRow}><Text style={S.totalesLabel}>IGV (18%)</Text><Text style={S.totalesValue}>{fmt(d.igv)}</Text></View>
          <View style={S.totalFinalRow}><Text style={S.totalFinalLabel}>TOTAL</Text><Text style={S.totalFinalValue}>{fmt(d.total)}</Text></View>
        </View>
      </View>

      <View style={S.notasWrap}>
        <Text style={S.notasTitle}>Observaciones</Text>
        <Text style={S.notasBullet}>• Precios sujetos a disponibilidad de stock.</Text>
        <Text style={S.notasBullet}>• Cotización válida hasta el {d.valido_hasta}.</Text>
        <Text style={S.notasBullet}>• Para confirmar el pedido, comuníquese con nuestro equipo de ventas.</Text>
        {d.notas && <Text style={S.notasBullet}>• {d.notas}</Text>}
      </View>

      <View style={S.footer} fixed>
        <Text style={S.footerText}>+51 908 801 912  |  modasyestilosguor@gmail.com  |  www.modas-y-estilos-guor.pe</Text>
        <Text style={S.footerBrand}>GUOR S.A.C.</Text>
      </View>
    </Page>
  </Document>
);

export const exportCotizacionIndividualToPDF = async (data: CotizacionPDFData) => {
  if (typeof window === 'undefined') return;

  const asPdf = pdf();
  asPdf.updateContainer(<CotizacionDocument d={data} />);
  const blob = await asPdf.toBlob();
  downloadBlob(blob, `Cotizacion_GUOR_${data.numero}.pdf`);
};

export function buildCotizacionPDFData(
  cot: {
    numero: string;
    created_at: string;
    valida_hasta: string;
    total: number;
    subtotal: number;
    igv: number;
    monto_descuento?: number;
    costo_envio?: number;
    zona_envio?: string;
    notas_internas?: string;
    clientes?: {
      razon_social?: string;
      ruc?: string | number;
      telefono?: string;
      email?: string;
      direccion_fiscal?: string;
    } | null;
  },
  items: Array<{
    descripcion?: string;
    nombre?: string;
    talla_snapshot: string;
    color_snapshot: string;
    cantidad: number;
    precio_unitario_snapshot: number;
    subtotal: number;
  }>,
): CotizacionPDFData {
  const fmt8 = (iso: string) =>
    new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const subtotalBruto = Number(cot.subtotal);
  const descuentoMonto = Number(cot.monto_descuento ?? 0);
  const costoEnvio = Number(cot.costo_envio ?? 0);
  const igv = Number(cot.igv);
  const total = Number(cot.total);
  const descuentoPct = subtotalBruto > 0 && descuentoMonto > 0
    ? Math.round((descuentoMonto / subtotalBruto) * 100)
    : 0;

  return {
    numero: cot.numero,
    fecha: fmt8(cot.created_at),
    valido_hasta: fmt8(cot.valida_hasta),
    cliente_nombre: cot.clientes?.razon_social ?? 'Cliente General',
    cliente_ruc: cot.clientes?.ruc ? String(cot.clientes.ruc) : undefined,
    cliente_telefono: cot.clientes?.telefono,
    cliente_email: cot.clientes?.email,
    cliente_direccion: cot.clientes?.direccion_fiscal,
    moneda: 'Soles (PEN)',
    zona_envio: cot.zona_envio,
    notas: cot.notas_internas?.replace(/\[ERP_META\][\s\S]*$/, '').trim() || undefined,
    items: items.map((it, i) => ({
      numero: i + 1,
      descripcion: it.descripcion ?? it.nombre ?? '—',
      talla: it.talla_snapshot,
      color: it.color_snapshot,
      cantidad: Number(it.cantidad),
      precio_unitario: Number(it.precio_unitario_snapshot),
      total: Number(it.subtotal),
    })),
    subtotal: subtotalBruto,
    descuento_pct: descuentoPct,
    descuento_monto: descuentoMonto,
    costo_envio: costoEnvio,
    igv,
    total,
  };
}