import ExcelJS from 'exceljs';

import type {
  ReporteTallerItem,
  ReporteTallerFilters,
} from '@/types/reporte-talleres';

interface Props {
  data: ReporteTallerItem[];
  filters?: ReporteTallerFilters;
}

export async function exportReporteTalleresExcel({
  data,
  filters,
}: Props) {

  const workbook = new ExcelJS.Workbook();

  const worksheet =
    workbook.addWorksheet('Reporte Talleres');

  // TITULO
  worksheet.mergeCells('A1:F1');

  worksheet.getCell('A1').value =
    'Reporte de Talleres Externos';

  worksheet.getCell('A1').font = {
    size: 18,
    bold: true,
    color: {
      argb: '231E1D',
    },
  };

  // FILTROS
  worksheet.getCell('A3').value =
    `Taller: ${filters?.taller || 'Todos'}`;

  worksheet.getCell('A4').value =
    `Estado: ${filters?.estado || 'Todos'}`;

  worksheet.getCell('A5').value =
    `Fecha Inicio: ${filters?.fechaInicio || 'No especificada'}`;

  worksheet.getCell('A6').value =
    `Fecha Fin: ${filters?.fechaFin || 'No especificada'}`;

  // HEADERS
  const headerRow = worksheet.addRow([
    'Taller',
    'Pedido',
    'Cantidad',
    'Avance',
    'Fecha Compromiso',
    'Estado',
  ]);

  headerRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: {
        argb: 'FFFFFF',
      },
    };

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: 'B5854B',
      },
    };
  });

  // DATA
  data.forEach((item) => {
    worksheet.addRow([
      item.taller,
      item.pedido,
      item.cantidad,
      `${item.avance}%`,
      item.fechaCompromiso,
      item.estado,
    ]);
  });

  // COLUMNAS
  worksheet.columns = [
    { width: 28 },
    { width: 20 },
    { width: 16 },
    { width: 16 },
    { width: 22 },
    { width: 18 },
  ];

  // ESPACIADO
  worksheet.eachRow((row) => {
    row.height = 24;
  });

  const buffer =
    await workbook.xlsx.writeBuffer();

  return buffer;
}