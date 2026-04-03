import * as XLSX from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

// Definimos los colores como Tuplas para evitar errores de TypeScript
type RGB = [number, number, number];
const PINK_GUOR: RGB = [219, 39, 119];
const BG_CREAM: RGB = [255, 246, 228];

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
  }).format(amount || 0);
};

const formatDate = (date: string | Date | null) => {
  if (!date) return "S/F";
  return new Date(date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
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
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    doc.addImage(img, 'PNG', 14, 8, 22, 22);
    
    doc.setFontSize(20);
    doc.setTextColor(pinkGUOR[0], pinkGUOR[1], pinkGUOR[2]);
    doc.text(title, 42, 18);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80); 
    doc.text(subtitle || "Reporte Oficial Sistema GUOR", 42, 25);
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 42, 31);

    return 48;
  } catch (e) {
    doc.setFontSize(18);
    doc.setTextColor(pinkGUOR[0], pinkGUOR[1], pinkGUOR[2]);
    doc.text(title, 14, 20);
    return 30;
  }
};

const getImageData = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!imageUrl) return resolve("NO_IMAGE");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const MAX_WIDTH = 100; 
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => resolve("NO_IMAGE");
    setTimeout(() => resolve("NO_IMAGE"), 2500);
  });
};

// =====================================================
// EXPORTACIÓN A EXCEL (GENÉRICA)
// =====================================================

export const exportToExcel = async (data: any[], config: ExcelExportConfig) => {
  if (data.length === 0) return;
  const workbook = new XLSX.Workbook();
  const worksheet = workbook.addWorksheet(config.sheetName || "Datos");
  const keys = Object.keys(data[0]);
  worksheet.columns = keys.map(key => ({ header: key, key: key, width: 20 }));
  data.forEach(row => worksheet.addRow(row));
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.filename}_${new Date().toISOString().split("T")[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

// =====================================================
// EXPORTACIÓN A PDF (GENÉRICA)
// =====================================================

export const exportToPDF = async (headers: string[][], body: any[][], config: PDFExportConfig) => {
  const doc = new jsPDF({ orientation: config.orientation || 'portrait' });
  const startY = await drawHeaderWithLogo(doc, config.title, config.subtitle);

  autoTable(doc, {
    head: headers,
    body: body,
    startY: startY,
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [219, 39, 119], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
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
// MÓDULOS ESPECÍFICOS
// =====================================================

// 1. PRODUCTOS (Catálogo con imágenes)
export const exportProductosToPDFWithImages = async (productos: any[]) => {
  const productosFiltrados = productos.filter(p => Number(p.stock) > 0);
  if (productosFiltrados.length === 0) throw new Error("No hay productos con stock.");
  
  const doc = new jsPDF({ orientation: 'portrait' });
  const startY = await drawHeaderWithLogo(doc, "CATÁLOGO DE PRODUCTOS", "Inventario oficial GUOR");
  
  const tableRows = await Promise.all(productosFiltrados.map(async (p) => {
    const imgBase64 = await getImageData(p.imagen_url);
    return [imgBase64, p.sku, p.nombre, p.categorias?.nombre || 'General', formatCurrency(Number(p.precio)), p.stock.toString()];
  }));

  autoTable(doc, {
    head: [['Imagen', 'SKU', 'Nombre', 'Categoría', 'Precio', 'Stock']],
    body: tableRows,
    startY: startY + 5,
    styles: { valign: 'middle', fontSize: 8 },
    columnStyles: { 0: { cellWidth: 25, fontSize: 0.1, textColor: [255, 246, 228] } },
    headStyles: { fillColor: [219, 39, 119] },
    didDrawCell: (data) => {
      if (data.column.index === 0 && data.cell.section === 'body') {
        const img = data.cell.raw as string;
        if (img && img.startsWith("data:image")) {
          doc.addImage(img, 'JPEG', data.cell.x + 2, data.cell.y + 2, 20, 20);
        }
      }
    },
    didParseCell: (data) => { if (data.section === 'body') data.row.height = 25; }
  });

  doc.save(`Catalogo_GUOR.pdf`);
};

// 2. INSUMOS / INVENTARIO
export const exportInsumosToExcel = (insumos: any[]) => {
  const data = insumos.map(i => ({
    'Código': i.codigo,
    'Insumo': i.nombre,
    'Stock': Number(i.stock),
    'Unidad': i.unidad_medida,
    'Costo Unit.': i.costo_unitario,
    'Valorización': Number(i.stock) * Number(i.costo_unitario)
  }));
  exportToExcel(data, { filename: 'Inventario_Insumos', sheetName: 'Insumos' });
};

// 3. CONFECCIÓN / PRODUCCIÓN
export const exportConfeccionToPDF = async (lotes: any[]) => {
  const headers = [["LOTE", "PRODUCTO", "CANTIDAD", "TALLER", "INICIO", "ENTREGA", "ESTADO"]];
  const body = lotes.map(l => [
    l.codigo_lote || `ID-${l.id}`,
    l.productos?.nombre || 'N/A',
    l.cantidad_total,
    l.taller_asignado || 'Pendiente',
    formatDate(l.fecha_inicio),
    formatDate(l.fecha_entrega_estimada),
    l.estado.toUpperCase()
  ]);
  await exportToPDF(headers, body, {
    filename: 'Plan_Produccion_Confeccion',
    title: 'ORDENES DE CONFECCIÓN',
    orientation: 'landscape'
  });
};

// 4. CLIENTES Y USUARIOS
export const exportClientesToExcel = (clientes: any[]) => {
  const data = clientes.map(c => ({
    'Razón Social/Nombre': c.razon_social || c.nombre,
    'RUC/DNI': c.documento,
    'Email': c.email,
    'Teléfono': c.telefono,
    'Dirección': c.direccion,
    'Tipo': c.tipo_cliente
  }));
  exportToExcel(data, { filename: 'Cartera_Clientes' });
};

export const exportUsuariosToPDF = (usuarios: any[]) => {
  const headers = [["NOMBRE", "EMAIL", "ROL", "ESTADO"]];
  const body = usuarios.map(u => [u.nombre, u.email, u.rol?.toUpperCase(), u.activo ? 'ACTIVO' : 'INACTIVO']);
  exportToPDF(headers, body, { filename: 'Usuarios_Sistema', title: 'PERSONAL REGISTRADO' });
};

// 5. COTIZACIONES (PDF Detallado)
export const exportCotizacionPDF = async (cotizacion: any) => {
  const doc = new jsPDF();
  const pinkGUOR = [219, 39, 119];
  const lightGray = [245, 245, 245];
  const pageWidth = doc.internal.pageSize.width;

  // 1. Encabezado Corporativo (Logo y Franja)
  const startY = await drawHeaderWithLogo(doc, "COTIZACIÓN", `N°: ${cotizacion.numero_cotizacion}`);

  // 2. Sección: Datos del Cliente y Condiciones (Dos columnas)
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  // Columna Izquierda: Cliente
  doc.setFont('helvetica', 'bold');
  doc.text("DATOS DEL CLIENTE", 14, startY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${cotizacion.clientes?.nombre || 'Público General'}`, 14, startY + 12);
  doc.text(`RUC/DNI: ${cotizacion.clientes?.documento || '-'}`, 14, startY + 18);
  doc.text(`Tel: ${cotizacion.clientes?.telefono || '-'}`, 14, startY + 24);

  // Columna Derecha: Condiciones
  const rightCol = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.text("CONDICIONES", rightCol, startY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatDate(cotizacion.created_at)}`, rightCol, startY + 12);
  doc.text(`Válido hasta: ${formatDate(cotizacion.fecha_vencimiento)}`, rightCol, startY + 18);
  doc.text(`Moneda: Soles (PEN)`, rightCol, startY + 24);

  // 3. Tabla de Productos (Detallada)
  const headers = [["#", "Descripción", "Talla", "Color", "Cant.", "P. Unit.", "Total"]];
  const body = cotizacion.items.map((item: any, index: number) => [
    index + 1,
    item.productos?.nombre || 'Producto',
    item.talla || '-',
    item.color || '-',
    item.cantidad,
    formatCurrency(item.precio_unitario),
    formatCurrency(item.subtotal)
  ]);

  autoTable(doc, {
    head: headers,
    body: body,
    startY: startY + 35,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: PINK_GUOR, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      4: { halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'right' }
    },
    alternateRowStyles: { fillColor: [252, 252, 252] }
  });

  // 4. Cuadro de Totales (Alineado a la derecha)
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const subtotal = cotizacion.total / 1.18;
  const igv = cotizacion.total - subtotal;

  const totalsStartX = pageWidth - 80;
  
  doc.setFontSize(9);
  doc.text("Subtotal:", totalsStartX, finalY);
  doc.text(formatCurrency(subtotal), pageWidth - 14, finalY, { align: 'right' });
  
  doc.text("IGV (18%):", totalsStartX, finalY + 7);
  doc.text(formatCurrency(igv), pageWidth - 14, finalY + 7, { align: 'right' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pinkGUOR[0], pinkGUOR[1], pinkGUOR[2]);
  doc.text("TOTAL:", totalsStartX, finalY + 15);
  doc.text(formatCurrency(cotizacion.total), pageWidth - 14, finalY + 15, { align: 'right' });

  // 5. Observaciones (Pie de página)
  const footerY = finalY + 30;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'bold');
  doc.text("OBSERVACIONES:", 14, footerY);
  doc.setFont('helvetica', 'normal');
  doc.text("• Precios sujetos a disponibilidad de stock.", 14, footerY + 5);
  doc.text(`• Cotización válida hasta el ${formatDate(cotizacion.fecha_vencimiento)}.`, 14, footerY + 10);
  doc.text("• Para confirmar el pedido, comuníquese con nuestro equipo de ventas.", 14, footerY + 15);

  // 6. Línea final de contacto
  doc.setDrawColor(200);
  doc.line(14, doc.internal.pageSize.height - 20, pageWidth - 14, doc.internal.pageSize.height - 20);
  doc.text(
    "RUC: 20555924624 | +51 908 801 912 | modasyestilosguor@gmail.com",
    pageWidth / 2,
    doc.internal.pageSize.height - 15,
    { align: 'center' }
  );

  doc.save(`Cotizacion_${cotizacion.numero_cotizacion}.pdf`);
};

// 6. VENTAS Y PAGOS (Con Resumen de Caja)
export const exportVentasDetailedPDF = async (ventas: any[]) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const startY = await drawHeaderWithLogo(doc, "REPORTE DETALLADO DE VENTAS", "Historial de ingresos y comprobantes");

  let totalNeto = 0;
  const body = ventas.map(v => {
    totalNeto += Number(v.total);
    return [
      v.numero_comprobante || v.id,
      v.ordenes?.clientes?.razon_social || "PUBLICO",
      formatDate(v.created_at),
      (v.ordenes?.metodo_pago || 'Efectivo').toUpperCase(),
      formatCurrency(Number(v.total))
    ];
  });

  autoTable(doc, {
    head: [["COMPROBANTE", "CLIENTE", "FECHA", "MÉTODO", "TOTAL"]],
    body: body,
    startY: startY,
    headStyles: { fillColor: [219, 39, 119] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(doc.internal.pageSize.width - 70, finalY, 60, 15, 'F');
  doc.setFontSize(10);
  doc.setTextColor(219, 39, 119);
  doc.text(`TOTAL RECAUDADO: ${formatCurrency(totalNeto)}`, doc.internal.pageSize.width - 65, finalY + 10);

  doc.save(`Reporte_Ventas_GUOR.pdf`);
};

// 7. REPORTES GERENCIALES (Multisheet Excel)
export const exportReporteGerencialExcel = async (ventas: any[], insumos: any[], confeccion: any[]) => {
  const workbook = new XLSX.Workbook();
  
  const wsV = workbook.addWorksheet('Resumen Ventas');
  wsV.addRow(['FECHA', 'COMPROBANTE', 'TOTAL']);
  ventas.forEach(v => wsV.addRow([formatDate(v.created_at), v.numero_comprobante, v.total]));

  const wsI = workbook.addWorksheet('Estado Insumos');
  wsI.addRow(['INSUMO', 'STOCK', 'UNIDAD']);
  insumos.forEach(i => wsI.addRow([i.nombre, i.stock, i.unidad_medida]));

  const wsC = workbook.addWorksheet('Producción');
  wsC.addRow(['LOTE', 'PRODUCTO', 'ESTADO']);
  confeccion.forEach(c => wsC.addRow([c.codigo_lote, c.productos?.nombre, c.estado]));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `REPORTE_GERENCIAL_GUOR.xlsx`;
  a.click();
};

// 8. Inventario y Movimientos de Stock (PDF con imágenes y detalles)

/**
 * Exporta el historial de movimientos de un producto específico (Kardex)
 */
export const exportKardexToPDF = async (producto: any, movimientos: any[]) => {
  const headers = [["FECHA", "TIPO", "MOTIVO", "CANTIDAD", "personal"]];
  
  const body = movimientos.map(m => [
    formatDate(m.created_at),
    m.tipo_movimiento.toUpperCase(),
    m.motivo || 'N/A',
    `${m.tipo_movimiento === 'entrada' ? '+' : '-'}${m.cantidad}`,
    m.usuarios?.nombre || 'Sistema'
  ]);

  await exportToPDF(headers, body, {
    filename: `Kardex_${producto.sku}_${producto.nombre.replace(/\s+/g, '_')}`,
    title: "HISTORIAL DE MOVIMIENTOS (KARDEX)",
    subtitle: `Producto: ${producto.nombre} | SKU: ${producto.sku}`,
    orientation: 'portrait'
  });
};

/**
 * Exportación general del inventario con estados de alerta
 */
export const exportInventarioGeneralExcel = (productos: any[]) => {
  const data = productos.map(p => ({
    'SKU': p.sku,
    'Producto': p.nombre,
    'Categoría': p.categorias?.nombre || 'General',
    'Stock Actual': p.stock,
    'Estado': p.stock === 0 ? 'AGOTADO' : p.stock <= 5 ? 'BAJO STOCK' : 'OK',
    'Precio Venta': formatCurrency(p.precio),
    'Valorizado': formatCurrency(p.stock * p.precio)
  }));

  exportToExcel(data, { 
    filename: 'Reporte_Inventario_General', 
    sheetName: 'Existencias' 
  });
};