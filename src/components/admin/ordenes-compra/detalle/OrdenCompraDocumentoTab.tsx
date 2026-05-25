'use client';

import { useState } from 'react';
import { FileText, RefreshCw, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  ordenId: string | number;
  pdfUrl?: string | null;
  onRegenerated?: () => void;
}

export function OrdenCompraDocumentoTab({ ordenId, pdfUrl, onRegenerated }: Props) {
  const [regenerating, setRegenerating] = useState(false);
  const [url, setUrl] = useState(pdfUrl ?? '');

  const handleRegenerar = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/admin/ordenes-compra/${ordenId}/documento`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al generar documento');
      setUrl(`${json.data.pdf_url}?t=${Date.now()}`);
      toast.success('Documento actualizado');
      onRegenerated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setRegenerating(false);
    }
  };

  const displayUrl = url || pdfUrl;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/60 to-white p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-600 text-white">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Documento PDF</h3>
            <p className="text-xs text-slate-500">
              Orden de compra oficial — estilo corporativo GUOR
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={handleRegenerar}
            disabled={regenerating}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerar
          </Button>
          {displayUrl && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => window.open(displayUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Abrir
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-amber-700 hover:bg-amber-800"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = displayUrl;
                  link.download = `orden-compra-${ordenId}.pdf`;
                  link.rel = 'noopener noreferrer';
                  link.click();
                }}
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar
              </Button>
            </>
          )}
        </div>
      </div>

      {displayUrl ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden shadow-inner min-h-[70vh]">
          <iframe
            title="Orden de compra PDF"
            src={`${displayUrl}${displayUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
            className="w-full h-[75vh] bg-white"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/30 p-16 text-center">
          <FileText className="w-12 h-12 text-amber-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">No hay documento disponible aún.</p>
          <Button onClick={handleRegenerar} disabled={regenerating}>
            Generar documento PDF
          </Button>
        </div>
      )}
    </div>
  );
}
