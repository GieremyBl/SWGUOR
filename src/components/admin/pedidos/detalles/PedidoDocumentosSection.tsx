'use client';

import { Download, ExternalLink, FileX } from 'lucide-react';
import type { PedidoDocumentoAdmin } from './types';
import { fmt } from './types';

interface Props {
  documentos: PedidoDocumentoAdmin[];
}

function formatearFecha(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PedidoDocumentosSection({ documentos }: Props) {
  if (documentos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center">
        <FileX className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-stone-600">
          Aún no hay facturas ni comprobantes generados
        </p>
        <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
          Al registrar pagos se generan facturas o boletas en PDF y aparecerán aquí con la fecha
          del pago.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {documentos.map((doc) => (
        <li
          key={`${doc.tipo}-${doc.id}`}
          className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/50 p-4"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-stone-900">{doc.tipo}</p>
            <p className="text-xs font-semibold text-violet-700 truncate">{doc.numero}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              <span>Emisión: {formatearFecha(doc.fecha_emision)}</span>
              {doc.fecha_pago && (
                <span>Pago: {formatearFecha(doc.fecha_pago)}</span>
              )}
              {doc.monto != null && (
                <span className="text-stone-600 normal-case tracking-normal">
                  {fmt(doc.monto, 'PEN')}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-8 px-3 rounded-lg bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-colors"
            >
              <ExternalLink size={12} className="mr-1.5" />
              Ver PDF
            </a>
            <a
              href={doc.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-8 px-3 rounded-lg border border-stone-200 bg-white text-[10px] font-black uppercase tracking-widest text-stone-700 hover:bg-stone-50"
            >
              <Download size={12} className="mr-1.5" />
              Descargar
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
