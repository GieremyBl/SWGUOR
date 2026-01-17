import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportConfig {
  filename: string;
  sheetName?: string;
  title?: string;
}

interface PDFExportOptions {
  filename?: string;
  title?: string;
}

export const exportToExcel = (data: any[], config: ExportConfig) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName || "Datos");
  
  XLSX.writeFile(workbook, `${config.filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
};

export const exportToPDF = (
  headers: string[][], 
  body: any[][], 
  options?: PDFExportOptions
) => {
  const doc = new jsPDF();
  
  // Título del documento
  doc.setFontSize(18);
  doc.setTextColor(219, 39, 119);
  doc.text(options?.title || "Reporte de Productos", 14, 20);
  
  // Fecha del reporte
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);

  // Generar tabla
  autoTable(doc, {
    head: headers,
    body: body,
    startY: 35,
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: { 
      fillColor: [219, 39, 119],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'center' }
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Guardar PDF
  const filename = options?.filename || 'reporte';
  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
};

export const exportProductosToPDFWithImages = async (productos: any[]) => {
  const doc = new jsPDF();
  const BUCKET_URL = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || "";
  
  doc.setFontSize(18);
  doc.setTextColor(219, 39, 119);
  doc.text("Catálogo de Productos - Guor", 14, 20);

  const getImageData = (imageName: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!imageName) return resolve("");
      const img = new Image();
      img.crossOrigin = "anonymous";
      const finalUrl = imageName.startsWith('http') ? imageName : `${BUCKET_URL}${imageName}`;
      img.src = finalUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve("");
    });
  };

  const tableRows = await Promise.all(productos.map(async (p) => {
    const imgBase64 = await getImageData(p.imagen);
    return [
      imgBase64, // Índice 0
      { content: `${p.nombre}\nSKU: ${p.sku}`, styles: { fontStyle: 'bold' } },
      p.categorias?.nombre || "General",
      `S/ ${(p.precio || 0).toFixed(2)}`,
      `${p.stock || 0} un.`
    ];
  }));

  autoTable(doc, {
    head: [["Imagen", "Detalles", "Categoría", "Precio", "Stock"]],
    body: tableRows,
    startY: 30,
    styles: { valign: 'middle', fontSize: 9 },
    columnStyles: {
      // CAPA 1: Hacemos el texto de la imagen invisible (tamaño casi 0 y color blanco)
      0: { cellWidth: 25, fontSize: 0.1, textColor: [255, 255, 255] }, 
      1: { cellWidth: 70 },
    },
    headStyles: { fillColor: [219, 39, 119] },
    
    // CAPA 2: Dibujamos la imagen y LIMPIAMOS el texto
    didDrawCell: (data) => {
      if (data.column.index === 0 && data.cell.section === 'body') {
        const imgRaw = data.cell.raw as string;
        
        if (imgRaw && imgRaw.startsWith("data:image")) {
          // Dibujar la imagen sobre la celda
          doc.addImage(imgRaw, 'JPEG', data.cell.x + 2, data.cell.y + 2, 21, 21);
        }
        
        // ESTO ELIMINA EL TEXTO GIGANTE: Decimos que el texto de la celda es vacío
        data.cell.text = [""]; 
      }
    },
    didParseCell: (data) => {
      if (data.section === 'body') data.row.height = 25;
    }
  });

  doc.save(`Catalogo_Guor_${new Date().getTime()}.pdf`);
};