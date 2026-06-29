export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { prisma } from '@/lib/prisma';

function formatoFecha(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[0-9]+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const despachoId = BigInt(id);
    const despacho = await prisma.despachos.findUnique({
      where: { id: despachoId },
      select: { pedido_id: true },
    });

    if (!despacho) {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }

    const guia = await prisma.guias_remision.findFirst({
      where: {
        pedido_id: despacho.pedido_id,
        tipo: 'despacho_cliente',
      },
      orderBy: { created_at: 'desc' },
      include: {
        pedidos: {
          include: {
            clientes: {
              select: {
                razon_social: true,
                nombre_comercial: true,
                ruc: true,
              },
            },
            pedido_items: {
              include: {
                productos: { select: { nombre: true } },
                variantes_producto: { select: { color: true, talla: true } },
              },
            },
          },
        },
      },
    });

    if (!guia) {
      return NextResponse.json({ error: 'Guía no encontrada' }, { status: 404 });
    }

    const cliente = guia.pedidos?.clientes;
    const pedidoItems = guia.pedidos?.pedido_items ?? [];
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let cursorY = 48;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('GUÍA DE REMISIÓN', marginX, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    cursorY += 18;
    doc.text(`Número: ${guia.numero}`, marginX, cursorY);
    cursorY += 14;
    doc.text(`Estado: ${guia.estado.replace(/_/g, ' ')}`, marginX, cursorY);
    cursorY += 14;
    doc.text(`Emisión: ${formatoFecha(guia.fecha_emision)}`, marginX, cursorY);
    cursorY += 14;
    doc.text(`Traslado: ${formatoFecha(guia.fecha_traslado)}`, marginX, cursorY);
    cursorY += 14;
    doc.text(`Entrega: ${formatoFecha(guia.fecha_entrega)}`, marginX, cursorY);

    cursorY += 18;
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente', marginX, cursorY);
    doc.setFont('helvetica', 'normal');
    cursorY += 14;
    doc.text(cliente?.razon_social ?? cliente?.nombre_comercial ?? 'Sin cliente', marginX, cursorY);
    cursorY += 14;
    if (cliente?.ruc) {
      doc.text(`RUC: ${cliente.ruc}`, marginX, cursorY);
      cursorY += 14;
    }

    cursorY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Origen y destino', marginX, cursorY);
    doc.setFont('helvetica', 'normal');
    cursorY += 14;
    doc.text(`Origen: ${guia.origen_direccion}`, marginX, cursorY, { maxWidth: pageWidth - marginX * 2 });
    cursorY += 22;
    doc.text(`Destino: ${guia.destino_direccion}`, marginX, cursorY, { maxWidth: pageWidth - marginX * 2 });
    cursorY += 24;

    doc.setFont('helvetica', 'bold');
    doc.text('Transporte', marginX, cursorY);
    doc.setFont('helvetica', 'normal');
    cursorY += 14;
    doc.text(`Transportista: ${guia.transportista ?? '—'}`, marginX, cursorY);
    cursorY += 14;
    doc.text(`RUC transportista: ${guia.ruc_transportista ?? '—'}`, marginX, cursorY);
    cursorY += 14;
    doc.text(`Placa vehículo: ${guia.placa_vehiculo ?? '—'}`, marginX, cursorY);
    cursorY += 18;

    doc.setFont('helvetica', 'bold');
    doc.text(`Ítems del pedido (${pedidoItems.length})`, marginX, cursorY);
    doc.setFont('helvetica', 'normal');
    cursorY += 16;

    if (pedidoItems.length === 0) {
      doc.text('Sin ítems registrados.', marginX, cursorY);
    } else {
      pedidoItems.forEach((item, index) => {
        const descripcion = `${index + 1}. ${item.productos?.nombre ?? 'Producto'}${item.variantes_producto?.color ? ` - ${item.variantes_producto.color}` : ''}${item.variantes_producto?.talla ? ` / ${item.variantes_producto.talla}` : ''} x ${item.cantidad}`;
        const lineas = doc.splitTextToSize(descripcion, pageWidth - marginX * 2);
        if (cursorY > 720) {
          doc.addPage();
          cursorY = 48;
        }
        doc.text(lineas, marginX, cursorY);
        cursorY += lineas.length * 12 + 4;
      });
    }

    cursorY += 12;
    if (guia.observaciones) {
      doc.setFont('helvetica', 'bold');
      doc.text('Observaciones', marginX, cursorY);
      doc.setFont('helvetica', 'normal');
      cursorY += 14;
      const observaciones = doc.splitTextToSize(guia.observaciones, pageWidth - marginX * 2);
      doc.text(observaciones, marginX, cursorY);
      cursorY += observaciones.length * 12;
    }

    const pdf = Buffer.from(doc.output('arraybuffer'));
    const filename = `guia-remision-${guia.numero}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[GET /api/admin/despachos/:id/guias-remision/pdf]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}