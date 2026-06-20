'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TIPO_INCIDENCIA_CLIENTE_LABELS } from '@/lib/constants/incidencias-cliente';
import { uploadEvidenciaSoporte } from '@/lib/helpers/soporte-portal-helpers';
import type { CrearIncidenciaClienteInput } from '@/lib/schemas/incidencias-cliente';
import type { TipoIncidenciaCliente } from '@prisma/client';

const TIPOS = Object.entries(TIPO_INCIDENCIA_CLIENTE_LABELS) as [TipoIncidenciaCliente, string][];

interface ReportarIncidenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CrearIncidenciaClienteInput) => Promise<void>;
  isSubmitting?: boolean;
  pedidoIdInicial?: string;
}

export function ReportarIncidenciaModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  pedidoIdInicial = '',
}: ReportarIncidenciaModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pedidoId, setPedidoId] = useState(pedidoIdInicial);
  const [tipo, setTipo] = useState<TipoIncidenciaCliente>('defecto_confeccion');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPedidoId(pedidoIdInicial);
    setTipo('defecto_confeccion');
    setDescripcion('');
    setFoto(null);
    setFotoPreview(null);
    setError('');
  }, [open, pedidoIdInicial]);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('La evidencia no debe superar 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFoto(file);
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pedidoNum = Number(pedidoId);
    if (!pedidoId || Number.isNaN(pedidoNum) || pedidoNum <= 0) {
      setError('Ingresa un número de pedido válido.');
      return;
    }
    if (descripcion.trim().length < 10) {
      setError('Describe el problema con al menos 10 caracteres.');
      return;
    }

    try {
      const evidencia_url: string[] = [];
      if (foto) {
        const url = await uploadEvidenciaSoporte(pedidoNum, foto, 'incidencias');
        evidencia_url.push(url);
      }

      await onSubmit({
        pedido_id: pedidoNum,
        tipo,
        descripcion: descripcion.trim(),
        evidencia_url,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la incidencia.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar problema</DialogTitle>
          <DialogDescription>
            Vincule su reporte a un pedido específico para que soporte pueda atenderlo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pedido_id">
              N° de pedido <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pedido_id"
              type="number"
              min={1}
              value={pedidoId}
              onChange={(e) => setPedidoId(e.target.value)}
              placeholder="Ej. 1042"
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de incidencia</Label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoIncidenciaCliente)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              {TIPOS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="descripcion"
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe detalladamente el problema..."
              className="rounded-xl resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Evidencia (opcional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFoto}
              className="hidden"
            />
            {fotoPreview ? (
              <div className="relative rounded-xl overflow-hidden border aspect-video bg-slate-50">
                <Image src={fotoPreview} alt="Vista previa" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => {
                    setFoto(null);
                    setFotoPreview(null);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <Upload className="text-slate-400 mb-2" size={28} />
                <span className="text-sm text-slate-600 font-medium">Subir imagen de evidencia</span>
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl bg-rose-500 hover:bg-rose-600" disabled={isSubmitting}>
              <span className="inline-flex items-center">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar reporte
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
