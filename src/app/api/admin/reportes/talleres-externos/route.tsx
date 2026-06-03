import React from 'react';

import { NextResponse } from 'next/server';

import { renderToBuffer } from '@react-pdf/renderer';

import { getReporteTalleresExternos } from '@/lib/services/reportes-talleres.service';

import { ReporteTalleresExternosPDF } from '@/lib/pdf/reporte-talleres-externos-pdf';

import { exportReporteTalleresExcel } from '@/lib/utils/export-reporte-talleres-excel';

export async function GET(request: Request) {

  try {

    const { searchParams } =
      new URL(request.url);

    const taller =
      searchParams.get('taller') ||
      undefined;

    const estado =
      searchParams.get('estado') ||
      undefined;

    const fechaInicio =
      searchParams.get('fechaInicio') ||
      undefined;

    const fechaFin =
      searchParams.get('fechaFin') ||
      undefined;

    const exportType =
      searchParams.get('export');

    const filters = {
      taller,
      estado: estado as any,
      fechaInicio,
      fechaFin,
    };

    const reporte =
      await getReporteTalleresExternos(
        filters
      );

    // EXPORT PDF
    if (exportType === 'pdf') {

      const pdfBuffer =
  await renderToBuffer(
    <ReporteTalleresExternosPDF
      data={reporte.data}
      filters={filters}
    />
  );

      return new Response(
        Buffer.from(pdfBuffer),
        {
          headers: {
            'Content-Type':
              'application/pdf',

            'Content-Disposition':
              'inline; filename="reporte-talleres-externos.pdf"',
          },
        }
      );
    }

    // EXPORT EXCEL
    if (exportType === 'excel') {

      const excelBuffer =
        await exportReporteTalleresExcel({
          data: reporte.data,
          filters,
        });

      return new Response(
        Buffer.from(excelBuffer),
        {
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

            'Content-Disposition':
              'attachment; filename="reporte-talleres-externos.xlsx"',
          },
        }
      );
    }

    // JSON NORMAL
    return NextResponse.json(
      reporte
    );

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error:
          'Error generando reporte',
      },
      {
        status: 500,
      }
    );
  }
}