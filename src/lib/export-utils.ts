import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// Carga el logo y lo añade al documento con un fondo corporativo
const drawHeaderWithLogo = async (doc: jsPDF, title: string, subtitle?: string): Promise<number> => {
  const exactBgColor = [255, 246, 228];
  const pinkGUOR = [219, 39, 119];
  const pageWidth = doc.internal.pageSize.width;

  try {
    // 1. Dibujar el fondo del encabezado (Franja de color)
    doc.setFillColor(exactBgColor[0], exactBgColor[1], exactBgColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F'); // Un rectángulo sólido de 40mm de alto

    // 2. Cargar e insertar el Logo
    const img = new Image();
    img.src = '/logo.png';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    // El logo se coloca sobre la franja blanca o con un pequeño borde si prefieres
    // Aquí lo ponemos en una posición limpia
    doc.addImage(img, 'PNG', 14, 8, 22, 22);
    
    // 3. Títulos (Cambiamos el color a BLANCO para que resalte sobre el rosa)
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

    return 48; // Aumentamos el margen para que la tabla no pegue con la franja
  } catch (e) {
    // Fallback si falla el logo: Solo texto rosa sobre fondo blanco
    doc.setFontSize(18);
    doc.setTextColor(pinkGUOR[0], pinkGUOR[1], pinkGUOR[2]);
    doc.text(title, 14, 20);
    return 30;
  }
};

// =====================================================
// EXPORTACIÓN A EXCEL
// =====================================================

export const exportToExcel = (data: any[], config: ExcelExportConfig) => {
  if (data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName || "Datos");
  const fecha = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${config.filename}_${fecha}.xlsx`);
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
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [219, 39, 119], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
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
      img.crossOrigin = "anonymous"; // Vital para evitar errores de CORS [cite: 11]
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve("NO_IMAGE");
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
  
  const data = productos.map(p => ({
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
