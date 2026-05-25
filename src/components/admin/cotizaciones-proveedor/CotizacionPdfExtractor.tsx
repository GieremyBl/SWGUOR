'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  GEMINI_EXTRACT_DELAY_MS,
  MAX_PDF_EXTRACCION_BYTES,
  MAX_PDF_EXTRACCION_LOTE,
} from '@/lib/constants/gemini';
import type { CotizacionExtraccionIA } from '@/lib/schemas/cotizacion-extraccion-ia';
import { fusionarExtracciones } from './apply-extraccion-to-form';

interface Props {
  disabled?: boolean;
  onExtracted: (data: CotizacionExtraccionIA, files: File[]) => void;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function CotizacionPdfExtractor({ disabled, onExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const pickFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const selected = Array.from(list).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    );
    if (selected.length === 0) {
      toast.error('Solo se permiten archivos PDF');
      return;
    }
    const oversized = selected.find((f) => f.size > MAX_PDF_EXTRACCION_BYTES);
    if (oversized) {
      toast.error(`${oversized.name} supera 10 MB`);
      return;
    }
    const merged = [...files, ...selected].slice(0, MAX_PDF_EXTRACCION_LOTE);
    if (merged.length < files.length + selected.length) {
      toast.warning(`Máximo ${MAX_PDF_EXTRACCION_LOTE} PDFs por lote`);
    }
    setFiles(merged);
  };

  const extractSequential = async () => {
    if (files.length === 0) {
      toast.error('Seleccione al menos un PDF');
      return;
    }

    setProcessing(true);
    const resultados: CotizacionExtraccionIA[] = [];

    try {
      for (let i = 0; i < files.length; i += 1) {
        setProgress({ current: i + 1, total: files.length });
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/ai/extract-cotizacion', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || `Error al procesar ${file.name}`);
        }
        resultados.push(json.data as CotizacionExtraccionIA);

        if (i < files.length - 1) {
          await sleep(GEMINI_EXTRACT_DELAY_MS);
        }
      }

      const fusion = fusionarExtracciones(resultados);
      onExtracted(fusion, files);
      toast.success(
        files.length === 1
          ? 'Cotización extraída con IA'
          : `${files.length} PDFs procesados y fusionados`,
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error en extracción IA');
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-700 text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Extracción IA (CUS_44)</h3>
          <p className="text-xs text-slate-500">
            Suba uno o más PDFs. Se procesan en serie para respetar el límite de Gemini.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        disabled={disabled || processing}
        onChange={(e) => pickFiles(e.target.files)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={disabled || processing}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-1" />
          Agregar PDFs
        </Button>
        <Button
          type="button"
          className="rounded-xl bg-indigo-700 hover:bg-indigo-800"
          disabled={disabled || processing || files.length === 0}
          onClick={extractSequential}
        >
          {processing ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1" />
          )}
          {processing && progress
            ? `Procesando ${progress.current} de ${progress.total}...`
            : 'Extraer con IA'}
        </Button>
      </div>

      {files.length > 0 && (
        <ul className="space-y-1 text-sm">
          {files.map((f, idx) => (
            <li
              key={`${f.name}-${idx}`}
              className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border"
            >
              <span className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="truncate">{f.name}</span>
              </span>
              <button
                type="button"
                className="text-slate-400 hover:text-red-500"
                disabled={processing}
                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
