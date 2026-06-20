'use client';

import { ExternalLink, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTipoComprobanteLabel } from '@/lib/constants/portal-pago';
import type { AdminPagoDetalleComprobante } from '@/lib/schemas/admin-pago-detalle';
import { cn } from '@/lib/utils';

interface Props {
  comprobante: AdminPagoDetalleComprobante | null;
  montoPago: number;
}

const ESTADO_SUNAT_STYLES: Record<string, string> = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  enviado: 'bg-blue-50 text-blue-700 border-blue-200',
  aceptado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rechazado: 'bg-red-50 text-red-700 border-red-200',
};

const ESTADO_SUNAT_LABELS: Record<string, string> = {
  pendiente: 'Pendiente SUNAT',
  enviado: 'Enviado a SUNAT',
  aceptado: 'Aceptado SUNAT',
  rechazado: 'Rechazado SUNAT',
};

function formatMoney(value: number, moneda = 'PEN') {
  const symbol = moneda === 'PEN' ? 'S/' : moneda;
  return `${symbol} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function PagoDetalleComprobanteSection({ comprobante, montoPago }: Props) {
  if (!comprobante) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-600">Sin comprobante emitido</p>
        <p className="text-xs text-slate-400 mt-1">
          Aún no se generó factura o boleta vinculada a este pago.
        </p>
      </div>
    );
  }

  const numero =
    comprobante.numero_completo ?? `${comprobante.serie}-${comprobante.correlativo}`;

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
            Comprobante / Factura
          </p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{numero}</p>
          <p className="text-xs text-slate-600 mt-0.5">
            {getTipoComprobanteLabel(comprobante.tipo)} · {formatDate(comprobante.fecha_emision)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] uppercase font-bold tracking-wider',
            ESTADO_SUNAT_STYLES[comprobante.estado_sunat] ?? ESTADO_SUNAT_STYLES.pendiente,
          )}
        >
          {ESTADO_SUNAT_LABELS[comprobante.estado_sunat] ?? comprobante.estado_sunat}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-white/80 border border-emerald-100 p-3">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Subtotal</p>
          <p className="font-bold text-slate-900 tabular-nums">
            {formatMoney(comprobante.subtotal, comprobante.moneda)}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 border border-emerald-100 p-3">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">IGV</p>
          <p className="font-bold text-slate-900 tabular-nums">
            {formatMoney(comprobante.igv, comprobante.moneda)}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 border border-emerald-100 p-3">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total comprobante
          </p>
          <p className="font-black text-emerald-700 tabular-nums">
            {formatMoney(comprobante.total, comprobante.moneda)}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 border border-emerald-100 p-3">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Monto del pago
          </p>
          <p className="font-black text-indigo-700 tabular-nums">
            {formatMoney(montoPago, comprobante.moneda)}
          </p>
        </div>
      </div>

      {(comprobante.pdf_url || comprobante.xml_url || comprobante.cdr_url) && (
        <div className="flex flex-wrap gap-2">
          {comprobante.pdf_url && (
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <a href={comprobante.pdf_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Ver PDF
              </a>
            </Button>
          )}
          {comprobante.xml_url && (
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <a href={comprobante.xml_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                XML
              </a>
            </Button>
          )}
          {comprobante.cdr_url && (
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <a href={comprobante.cdr_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                CDR
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
