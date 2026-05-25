'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  cotizacionId?: string | number | null;
  pdfUrl?: string | null;
  disabled?: boolean;
  onFileSelected?: (file: File | null) => void;
  onUploaded?: (url: string) => void;
  onUpload?: (file: File) => Promise<void>;
}

export function CotizacionProveedorPdfUpload({
  cotizacionId,
  pdfUrl,
  disabled,
  onFileSelected,
  onUploaded,
  onUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (f: File | null) => {
    if (f && f.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }
    setFile(f);
    onFileSelected?.(f);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Seleccione un PDF');
      return;
    }
    if (!onUpload) {
      onUploaded?.('');
      return;
    }
    setUploading(true);
    try {
      await onUpload(file);
      toast.success('PDF de referencia guardado');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al subir PDF');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-700 text-white">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Documento PDF de referencia</h3>
          <p className="text-xs text-slate-500">
            Adjunte la cotización recibida del proveedor (bucket documentos)
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-1" />
          {file ? file.name : 'Seleccionar PDF'}
        </Button>

        {cotizacionId && file && onUpload && (
          <Button
            type="button"
            className="rounded-xl bg-amber-700 hover:bg-amber-800"
            disabled={disabled || uploading}
            onClick={handleUpload}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-1" />
            )}
            Subir al servidor
          </Button>
        )}

        {pdfUrl && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="w-4 h-4 mr-1" /> Ver PDF actual
          </Button>
        )}
      </div>

      {!cotizacionId && file && (
        <p className="text-xs text-amber-800">
          El PDF se subirá automáticamente al guardar la cotización.
        </p>
      )}
    </div>
  );
}

