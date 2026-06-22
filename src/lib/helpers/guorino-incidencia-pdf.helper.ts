import jsPDF from 'jspdf';
import type { GuorinoIncidenciaPreview } from '@/lib/services/guorino-incidencia.service';

const SEVERIDAD_LABELS: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Crítica',
};

export async function descargarPreviewIncidenciaGuorinoPDF(
  preview: GuorinoIncidenciaPreview,
  cliente: { razon_social?: string | null; ruc?: string | null },
) {
  const doc = new jsPDF();
  const margin = 14;
  let y = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GUOR — Previsualización de Incidencia', margin, y);

  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Referencia: ${preview.id}`, margin, y);
  y += 5;
  doc.text(`Generado: ${new Date(preview.created_at).toLocaleString('es-PE')}`, margin, y);
  y += 5;
  doc.text(`Válido hasta: ${new Date(preview.expira_en).toLocaleString('es-PE')}`, margin, y);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.razon_social ?? 'Cliente portal', margin, y);
  if (cliente.ruc) {
    y += 5;
    doc.text(`RUC: ${cliente.ruc}`, margin, y);
  }

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle del reporte', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');

  const filas = [
    ['Pedido', `#${preview.pedido_id}`],
    ['Estado del pedido', preview.pedido_estado ?? '—'],
    ['Tipo', preview.tipo_label],
    ['Severidad', SEVERIDAD_LABELS[preview.severidad] ?? preview.severidad],
  ];

  for (const [label, valor] of filas) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(valor), margin + 42, y);
    y += 6;
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Descripción', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const lineas = doc.splitTextToSize(preview.descripcion, 180);
  doc.text(lineas, margin, y);

  y += lineas.length * 5 + 10;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    'Este documento es una previsualización. La incidencia se registrará solo si usted confirma en el chat.',
    margin,
    y,
  );

  doc.save(`GUOR-incidencia-prev-${preview.id.slice(-8)}.pdf`);
}
