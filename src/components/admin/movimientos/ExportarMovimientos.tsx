"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Movimiento } from "./MovimientosTable";

interface ExportarMovimientosProps {
  movimientos: Movimiento[];
  titulo?: string;
}

export function ExportarMovimientos({
  movimientos,
  titulo = "Movimientos de Inventario",
}: ExportarMovimientosProps) {
  const exportarExcel = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Movimientos");

      // Encabezado
      worksheet.columns = [
        { header: "Fecha", key: "fecha", width: 18 },
        { header: "Tipo", key: "tipo", width: 12 },
        { header: "Artículo", key: "articulo", width: 25 },
        { header: "Cantidad", key: "cantidad", width: 12 },
        { header: "Unidad", key: "unidad", width: 12 },
        { header: "Stock Anterior", key: "stock_anterior", width: 15 },
        { header: "Stock Posterior", key: "stock_posterior", width: 15 },
        { header: "Costo Unitario", key: "costo", width: 15 },
        { header: "Referencia", key: "referencia", width: 12 },
        { header: "Motivo", key: "motivo", width: 30 },
        { header: "Usuario", key: "usuario", width: 20 },
      ];

      // Estilos de encabezado
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };

      // Datos
      movimientos.forEach((mov) => {
        const tipoLabel =
          mov.tipo_movimiento === "entrada"
            ? "Entrada"
            : mov.tipo_movimiento === "salida"
              ? "Salida"
              : "Ajuste";

        const itemName =
          mov.productos?.nombre ||
          mov.producto?.nombre ||
          mov.insumo?.nombre ||
          mov.materiales?.nombre ||
          mov.material?.nombre ||
          "Desconocido";

        const unidad = mov.insumo?.unidad_medida || "unidades";

        const referencia = mov.referencia_tipo || "";

        worksheet.addRow({
          fecha: format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", {
            locale: es,
          }),
          tipo: tipoLabel,
          articulo: itemName,
          cantidad: mov.cantidad,
          unidad,
          stock_anterior: 
            mov.stock_anterior != null 
              ? mov.stock_anterior.toFixed(2) 
              : "-",
          stock_posterior:
            mov.stock_posterior != null
              ? mov.stock_posterior.toFixed(2)
              : "-",
          costo: mov.costo_unitario
            ? `$${mov.costo_unitario.toFixed(2)}`
            : "-",
          referencia,
          motivo: mov.motivo || "-",
          usuario: mov.usuarios?.personal_interno?.[0]?.nombre_completo ||
            mov.usuarios?.email?.split('@')[0] ||
            mov.usuario?.nombre ||
            "Sistema",
        });
      });

      // Autoajustar ancho de columnas
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const cellLength = cell.value ? String(cell.value).length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Descargar
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${titulo}-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel exportado exitosamente");
    } catch (error: any) {
      console.error("Error exportando Excel:", error);
      toast.error("Error al exportar Excel");
    }
  };

  const exportarPDF = async () => {
    try {
      const jsPDF = (await import("jspdf")).default;
      await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Título
      doc.setFontSize(16);
      doc.text(titulo, pageWidth / 2, 15, { align: "center" });

      // Fecha de descarga
      doc.setFontSize(10);
      doc.text(
        `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
        pageWidth / 2,
        22,
        { align: "center" }
      );

      // Tabla
      const tableData = movimientos.map((mov) => {
        const tipoLabel =
          mov.tipo_movimiento === "entrada"
            ? "Entrada"
            : mov.tipo_movimiento === "salida"
              ? "Salida"
              : "Ajuste";

        const itemName =
          mov.productos?.nombre ||
          mov.producto?.nombre ||
          mov.insumo?.nombre ||
          mov.materiales?.nombre ||
          mov.material?.nombre ||
          "Desconocido";

        return [
          format(new Date(mov.created_at), "dd/MM/yyyy", { locale: es }),
          tipoLabel,
          itemName.substring(0, 15),
          mov.cantidad.toString(),
          mov.stock_anterior?.toFixed(1) || "-",
          mov.stock_posterior?.toFixed(1) || "-",
          mov.referencia_tipo || "",
          (mov.motivo || "-").substring(0, 15),
        ];
      });

      const table = (doc as any).autoTable({
        head: [
          [
            "Fecha",
            "Tipo",
            "Artículo",
            "Cantidad",
            "Stock Ant.",
            "Stock Post.",
            "Ref.",
            "Motivo",
          ],
        ],
        body: tableData,
        startY: 28,
        margin: 10,
        headStyles: {
          fillColor: [68, 114, 196],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [242, 242, 242],
        },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 15 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15, halign: "right" },
          4: { cellWidth: 15, halign: "right" },
          5: { cellWidth: 15, halign: "right" },
          6: { cellWidth: 12 },
          7: { cellWidth: 25 },
        },
      });

      doc.save(
        `${titulo.replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`
      );
      toast.success("PDF exportado exitosamente");
    } catch (error: any) {
      console.error("Error exportando PDF:", error);
      toast.error("Error al exportar PDF");
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportarExcel}
        className="gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportarPDF}
        className="gap-2"
      >
        <FileText className="w-4 h-4" />
        PDF
      </Button>
    </div>
  );
}
