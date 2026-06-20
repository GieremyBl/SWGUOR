'use client';

import { Download, ExternalLink, FileX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { iconoDocumentoPedido } from '@/lib/constants/pedido-documentos';
import { usePedidoDocumentos } from '@/lib/hooks/usePedidoDocumentos';
import { cn } from '@/lib/utils';

interface PedidoDetalleDocumentosTabProps {
  pedidoId: number | string;
  className?: string;
}

function formatearFecha(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PedidoDetalleDocumentosTab({
  pedidoId,
  className,
}: PedidoDetalleDocumentosTabProps) {
  const { data: documentos = [], isLoading, error, refetch } = usePedidoDocumentos(pedidoId);

  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-slate-500', className)}>
        <Loader2 className="w-7 h-7 animate-spin text-[#b5854b] mb-3" />
        <p className="text-sm font-medium">Cargando expediente documental...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center', className)}>
        <p className="text-sm text-red-700 font-medium mb-3">
          {error instanceof Error ? error.message : 'Error al cargar documentos'}
        </p>
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-dashed border-[#e4c28a]/30 bg-[#fffdf8] px-6 py-14 text-center',
          className,
        )}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-[#e4c28a]/20 shadow-sm">
          <FileX className="w-7 h-7 text-[#b5854b]/50" />
        </div>
        <h3 className="text-base font-bold text-[#231e1d] mb-2">
          Aún no se han generado documentos para este pedido.
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Cuando se emitan facturas, guías de remisión o comprobantes de pago, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <ul className={cn('space-y-3', className)}>
      {documentos.map((doc) => {
        const Icon = iconoDocumentoPedido(doc.tipo_documento);
        const nombreArchivo = `${doc.tipo_documento}-${doc.numero_documento}`.replace(/\s+/g, '_');

        return (
          <li
            key={`${doc.tipo_documento}-${doc.id_referencia}`}
            className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-[#e4c28a]/20 bg-white p-4 shadow-sm hover:border-[#e4c28a]/40 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="shrink-0 p-2.5 rounded-xl bg-[#231e1d] text-[#e4c28a]">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-[#231e1d]">{doc.tipo_documento}</p>
                <p className="text-xs font-semibold text-[#b5854b] mt-0.5 truncate">
                  {doc.numero_documento}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Emitido: {formatearFecha(doc.fecha_emision)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-[#231e1d] hover:bg-[#b5854b] text-[#e4c28a]"
                onClick={() => window.open(doc.url_archivo, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Documento
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl border-[#e4c28a]/30"
                asChild
              >
                <a href={doc.url_archivo} download={nombreArchivo} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </a>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
