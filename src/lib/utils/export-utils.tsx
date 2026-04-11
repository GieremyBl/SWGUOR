import * as XLSX from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { pdf, Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

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

// =====================================================
// HELPERS DE UTILIDAD
// =====================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount);
};

// Carga el logo y lo añade al documento con un fondo corporativo (Versión Segura)
const drawHeaderWithLogo = async (doc: jsPDF, title: string, subtitle?: string): Promise<number> => {
  const exactBgColor = [255, 246, 228];
  const pinkGUOR = [219, 39, 119];
  const pageWidth = doc.internal.pageSize.width;

  try {
    doc.setFillColor(exactBgColor[0], exactBgColor[1], exactBgColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F'); 

    const img = new Image();
    img.src = '/logo.png';
    
    // AÑADIMOS UN TIMEOUT: Si el logo no carga en 1.5s, forzamos el renderizado sin él
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      setTimeout(() => reject(new Error("Timeout loading logo")), 1500); 
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
  } catch (e) {
    // Si falla o tarda mucho, entramos al Fallback automáticamente
    console.warn("No se pudo cargar el logo, generando encabezado de texto...");
    doc.setFontSize(18);
    doc.setTextColor(pinkGUOR[0], pinkGUOR[1], pinkGUOR[2]);
    doc.text(title, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80); 
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 28);
    return 35; // Un margen un poco más pequeño si no hay logo
  }
};

// =====================================================
// EXPORTACIÓN A EXCEL
// =====================================================

export const exportToExcel = async (data: any[], config: ExcelExportConfig) => {
  if (data.length === 0) return;

  const workbook = new XLSX.Workbook();
  const worksheet = workbook.addWorksheet(config.sheetName || "Datos");

  // Columnas basadas en las keys del primer objeto
  const keys = Object.keys(data[0]);
  worksheet.columns = keys.map(key => ({
    header: key,
    key: key,
    width: 20
  }));

  // Agregar filas
  data.forEach(row => worksheet.addRow(row));

  // Descargar en el navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fecha = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `${config.filename}_${fecha}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};


// =====================================================
// EXPORTACIÓN A PDF - CATEGORIAS
// =====================================================

// 1. Componente de Diseño para Categorías
const CategoriasDocument = ({ data, config }: any) => {
  const colWidths = ['25%', '40%', '15%', '20%'];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>Directorio Oficial - Modas y Estilos GUOR</Text>
            <Text style={styles.subtitle}>Generado: {new Date().toLocaleString('es-PE')}</Text>
          </View>
        </View>

        {/* TABLA */}
        <View style={styles.table}>
          {/* Fila de Títulos */}
          <View style={styles.tableRow}>
            {['CATEGORÍA', 'DESCRIPCIÓN', 'ESTADO', 'CREACIÓN'].map((header, i) => (
              <View key={i} style={[styles.tableColHeader, { width: colWidths[i] }]}>
                <Text style={styles.tableCellHeader}>{header}</Text>
              </View>
            ))}
          </View>

          {/* Filas de Datos */}
          {data.map((item: any, rowIndex: number) => (
            <View key={rowIndex} style={rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowStriped}>
              <View style={[styles.tableCol, { width: colWidths[0] }]}>
                <Text style={styles.tableCell}>{item.nombre || "---"}</Text>
              </View>
              <View style={[styles.tableCol, { width: colWidths[1] }]}>
                <Text style={styles.tableCell}>{item.descripcion || "Sin descripción"}</Text>
              </View>
              <View style={[styles.tableCol, { width: colWidths[2] }]}>
                <Text style={styles.tableCell}>{item.activo ? "Activa" : "Inactiva"}</Text>
              </View>
              <View style={[styles.tableCol, { width: colWidths[3] }]}>
                <Text style={styles.tableCell}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// 2. Función Ejecutora para Categorías
export const exportCategoriasToPDF = async (data: any[], config: { title: string; filename: string }) => {
  if (!data || data.length === 0) return;

  const asPdf = pdf();
  asPdf.updateContainer(<CategoriasDocument data={data} config={config} />);
  const blob = await asPdf.toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

// =====================================================
// EXPORTACIÓN A PDF - SIMPLE
// =====================================================

export const exportToPDF = async (
  headers: string[][], 
  body: any[][], 
  config: PDFExportConfig
) => {
  const doc = new jsPDF({ orientation: config.orientation || 'portrait' });
  const startY = await drawHeaderWithLogo(doc, config.title, config.subtitle);

  autoTable(doc, {
  head: headers,
  body: body,
  startY: startY,
  styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
  headStyles: { fillColor: [219, 39, 119], textColor: 255 },
  alternateRowStyles: { fillColor: [250, 250, 250] },
  rowPageBreak: 'auto',
  showHead: 'everyPage',
  margin: { top: 40, bottom: 20 }
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`GUOR S.A.C. - Página ${i} de ${totalPages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  doc.save(`${config.filename}.pdf`);
};
// =====================================================
// EXPORTACIÓN A PDF - INVENTARIO (@react-pdf/renderer)
// =====================================================

// 1. Definimos los estilos visuales del PDF
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF6E4', padding: 15, marginBottom: 20, borderRadius: 5 },
  logo: { width: 40, height: 40, marginRight: 15 },
  headerText: { display: 'flex', flexDirection: 'column' },
  title: { fontSize: 18, color: '#db2777', fontWeight: 'bold' },
  subtitle: { fontSize: 10, color: '#555', marginTop: 3 },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderBottomWidth: 0, borderRightWidth: 0 },
  tableRow: { flexDirection: 'row' },
  tableRowStriped: { flexDirection: 'row', backgroundColor: '#f9fafb' },
  tableColHeader: { borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#db2777', padding: 6 },
  tableCol: { borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderLeftWidth: 0, borderTopWidth: 0, padding: 6, justifyContent: 'center' },
  tableCellHeader: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  tableCell: { fontSize: 8, color: '#333' }
});

// 2. Componente de Diseño del PDF
const InventarioDocument = ({ data, categorias, config }: any) => {
  const colWidths = ['15%', '35%', '20%', '10%', '10%', '10%'];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>Generado: {new Date().toLocaleString('es-PE')}</Text>
          </View>
        </View>

        {/* TABLA */}
        <View style={styles.table}>
          {/* Fila de Títulos */}
          <View style={styles.tableRow}>
            {['SKU', 'PRODUCTO', 'CATEGORÍA', 'STOCK', 'PRECIO', 'ESTADO'].map((header, i) => (
              <View key={i} style={[styles.tableColHeader, { width: colWidths[i] }]}>
                <Text style={styles.tableCellHeader}>{header}</Text>
              </View>
            ))}
          </View>

          {/* Filas de Datos */}
          {data.map((item: any, rowIndex: number) => {
            const cat = categorias.find((c: any) => c.id === item.categoria_id)?.nombre || "General";
            const est = item.stock === 0 ? "Agotado" : item.stock <= 5 ? "Bajo" : "Disp.";
            const pre = `S/ ${Number(item.precio || 0).toFixed(2)}`;

            return (
              <View key={rowIndex} style={rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowStriped}>
                <View style={[styles.tableCol, { width: colWidths[0] }]}><Text style={styles.tableCell}>{item.sku || "---"}</Text></View>
                <View style={[styles.tableCol, { width: colWidths[1] }]}><Text style={styles.tableCell}>{item.nombre || "---"}</Text></View>
                <View style={[styles.tableCol, { width: colWidths[2] }]}><Text style={styles.tableCell}>{cat}</Text></View>
                <View style={[styles.tableCol, { width: colWidths[3] }]}><Text style={styles.tableCell}>{item.stock ?? "0"}</Text></View>
                <View style={[styles.tableCol, { width: colWidths[4] }]}><Text style={styles.tableCell}>{pre}</Text></View>
                <View style={[styles.tableCol, { width: colWidths[5] }]}><Text style={styles.tableCell}>{est}</Text></View>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

// 3. Función Ejecutora
export const exportInventarioToPDF = async (data: any[], categorias: any[], config: PDFExportConfig) => {
  if (!data || data.length === 0) return;

  const asPdf = pdf();
  asPdf.updateContainer(<InventarioDocument data={data} categorias={categorias} config={config} />);
  const blob = await asPdf.toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

// =====================================================
// EXPORTACIÓN A PDF - CON IMÁGENES (CATÁLOGO)
// =====================================================

export const exportToPDFWithImages = async (
  data: any[], 
  config: PDFImageConfig
) => {
  if (data.length === 0) return;
  const doc = new jsPDF({ orientation: config.orientation || 'portrait' });
  
  const startY = await drawHeaderWithLogo(doc, config.title, config.subtitle);
  const imageKey = config.imageKey || 'imagen';
  const excludeFields = config.excludeFields || ['id', 'created_at'];

  // Función para convertir URL a Base64 asegurando la carga [cite: 11, 14]
  const getImageData = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!imageUrl) return resolve("NO_IMAGE");
    const img = new Image();
    img.crossOrigin = "anonymous";
    // Forzamos un tamaño pequeño para el canvas, no necesitamos 4K para una celda de 20mm
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      // Redimensionamos la imagen al cargarla para ahorrar memoria
      const MAX_WIDTH = 100; 
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6)); // Calidad 0.6 es suficiente
    };
    img.onerror = () => resolve("NO_IMAGE");
    // Timeout de seguridad: si una imagen no carga en 2s, seguimos adelante
    setTimeout(() => resolve("NO_IMAGE"), 2000);
  });
};

  const displayKeys = Object.keys(data[0]).filter(key => !excludeFields.includes(key));
  
  // Procesar todas las filas y esperar sus imágenes antes de dibujar la tabla [cite: 11, 14]
  const tableRows = await Promise.all(data.map(async (item) => {
    return await Promise.all(displayKeys.map(async (key) => {
      if (key === imageKey) {
        return await getImageData(item[key]);
      }
      return item[key]?.toString() || '-';
    }));
  }));

  const headers = displayKeys.map(key => 
    key === imageKey ? 'Imagen' : key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
  );

  const imageColIndex = displayKeys.indexOf(imageKey);

  autoTable(doc, {
    head: [headers],
    body: tableRows,
    startY: startY + 5,
    styles: { valign: 'middle', fontSize: 8 },
    columnStyles: { 
      [imageColIndex]: { cellWidth: 30, fontSize: 0.1, textColor: [255, 246, 228] } 
    },
    headStyles: { fillColor: [219, 39, 119] },
    didDrawCell: (data) => {
      if (data.column.index === imageColIndex && data.cell.section === 'body') {
        const imgRaw = data.cell.raw as string;
        if (imgRaw && imgRaw.startsWith("data:image")) {
          doc.addImage(imgRaw, 'JPEG', data.cell.x + 5, data.cell.y + 2, 20, 20);
        }
      }
    },
    didParseCell: (data) => { 
      if (data.section === 'body') data.row.height = 25; 
    }
  });

  doc.save(`${config.filename}.pdf`);
};

// =====================================================
// HELPERS ESPECÍFICOS DE PREPARACIÓN
// =====================================================

export const exportProductosToPDFWithImages = async (productos: any[]) => {
  // Filtrar productos con stock mayor a 400
  const productosFiltrados = productos.filter(p => Number(p.stock) > 400);

  // Si después de filtrar no queda nada, avisamos al usuario
  if (productosFiltrados.length === 0) {
    throw new Error("No hay productos con stock superior a 400 unidades.");
  }
  
  const data = productosFiltrados.map(p => ({
    imagen: p.imagen_url,
    sku: p.sku,
    nombre: p.nombre,
    categoria: p.categorias?.nombre || 'General',
    precio: formatCurrency(Number(p.precio)),
    stock: p.stock.toString()
  }));

  await exportToPDFWithImages(data, {
    filename: `Catalogo_Productos_GUOR`,
    title: "CATÁLOGO DE PRODUCTOS",
    subtitle: "Inventario oficial Modas y Estilos GUOR",
    imageKey: 'imagen'
  });
};

export const prepareVentasForPDF = (ventas: any[]) => {
  const headers = [["CÓDIGO", "CLIENTE", "FECHA", "ESTADO", "TOTAL"]];
  const body = ventas.map(v => [
    v.codigo_pedido,
    v.cliente?.nombre || 'Público General',
    new Date(v.created_at).toLocaleDateString('es-PE'),
    v.estado_pedido.toUpperCase(),
    formatCurrency(Number(v.total))
  ]);
  return { headers, body };
};

export const prepareVentasForExcel = (ventas: any[]) => {
  return ventas.map(v => ({
    'Código': v.codigo_pedido,
    'Cliente': v.cliente?.nombre || 'Público General',
    'Fecha': new Date(v.created_at).toLocaleDateString('es-PE'),
    'Subtotal': Number(v.subtotal),
    'Total': Number(v.total),
    'Estado': v.estado_pedido.toUpperCase()
  }));
};

export const prepareCategoriasForExcel = (categorias: any[]) => {
  return categorias.map(c => ({
    'Nombre de Categoría': c.nombre,
    'Descripción': c.descripcion || 'Sin descripción',
    'Estado': c.activo ? 'Activo' : 'Inactivo',
    'Fecha de Creación': new Date(c.created_at).toLocaleDateString('es-PE'),
  }));
};

export const exportVentasDetailedPDF = async (ventas: any[], config: PDFExportConfig) => {
  if (ventas.length === 0) return;

  const doc = new jsPDF({ 
    orientation: 'landscape', 
    unit: 'mm', 
    format: 'a4' 
  }); // Landscape para más detalle
  const startY = await drawHeaderWithLogo(doc, config.title, config.subtitle);

  // 1. Preparar datos y cálculos de resumen
  let totalRecaudado = 0;
  let totalImpuestos = 0;
  const metodosPago: Record<string, number> = {};

  const body = ventas.map(v => {
    const total = Number(v.total) || 0;
    const impuesto = Number(v.impuestos) || 0;
    const subtotal = Number(v.subtotal) || (total-impuesto);
    const metodo = (v.ordenes?.metodo_pago || 'Efectivo').toUpperCase();

    // Acumular totales para el resumen
    totalRecaudado += total;
    totalImpuestos += impuesto;
    metodosPago[metodo] = (metodosPago[metodo] || 0) + total;

    return [
      v.numero_comprobante || `ORD-${v.orden_id}`,
      v.ordenes?.clientes?.razon_social || "PÚBLICO GENERAL",
      new Date(v.created_at).toLocaleDateString('es-PE'),
      metodo,
      v.ordenes?.estado?.toUpperCase() || 'PAGADO',
      formatCurrency(Number(subtotal)),
      formatCurrency(impuesto),
      formatCurrency(total)
    ];
  });

  const headers = [["COMPROBANTE", "CLIENTE", "RUC", "FECHA", "MÉTODO", "ESTADO", "SUBTOTAL", "IGV", "TOTAL"]];

  // 2. Generar la tabla principal
  autoTable(doc, {
    head: headers,
    body: body,
    startY: startY,
    styles: { 
      fontSize: 8, 
      cellPadding: 3, 
      overflow: 'linebreak',
      halign: 'center' 
    },
    headStyles: { fillColor: [219, 39, 119], textColor: 255 },
    columnStyles: {
      1: { halign: 'left', cellWidth: 'auto' }, // El nombre del cliente crece según espacio
      7: { halign: 'right', fontStyle: 'bold' }  // Total a la derecha
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 14, right: 14 } // Márgenes consistentes con el logo
  });
  
  // 3. Añadir Cuadro de Resumen al final
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  // Dibujar caja de resumen
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(pageWidth - 85, finalY, 70, 40, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("RESUMEN DE CAJA", pageWidth - 80, finalY + 8);
  
  doc.setFontSize(8);
  doc.text(`Total Bruto:`, pageWidth - 80, finalY + 18);
  doc.text(formatCurrency(totalRecaudado - totalImpuestos), pageWidth - 30, finalY + 18, { align: 'right' });
  
  doc.text(`Total Impuestos:`, pageWidth - 80, finalY + 24);
  doc.text(formatCurrency(totalImpuestos), pageWidth - 30, finalY + 24, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(219, 39, 119); // Rosa GUOR
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL NETO:`, pageWidth - 80, finalY + 34);
  doc.text(formatCurrency(totalRecaudado), pageWidth - 30, finalY + 34, { align: 'right' });

  // 4. Detalle por Métodos de Pago (Opcional, a la izquierda)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.setFontSize(8);
  let metodoY = finalY + 8;
  doc.text("DESGLOSE POR MÉTODO:", margin, metodoY);
  
  Object.entries(metodosPago).forEach(([metodo, monto]) => {
    metodoY += 6;
    doc.text(`${metodo}: ${formatCurrency(monto)}`, margin + 2, metodoY);
  });

  doc.save(`${config.filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};