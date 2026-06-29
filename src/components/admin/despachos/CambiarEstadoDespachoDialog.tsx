'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
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
import { ESTADOS_DESPACHO } from '@/lib/constants/estados';
import { subirFotoEntrega } from '@/lib/helpers/despacho-upload.client';
import type { EstadoDespacho } from '@prisma/client';

const ESTADOS_PERMITIDOS: EstadoDespacho[] = [
  'pendiente',
  'preparando',
  'en_almacen',
  'en_ruta',
  'entregado',
  'incidencia',
  'devuelto',
  'cancelado',
];

interface PerfilAyudanteEstado {
  nombreCompleto: string | null;
  placaVehiculo: string | null;
}

interface CambiarEstadoDespachoDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  despachoId: number;
  pedidoId: string;
  estadoObjetivo: EstadoDespacho | null;
  estadoActual: string;
  perfilAyudante?: PerfilAyudanteEstado | null;
  onSuccess?: () => void;
  inline?: boolean;
  className?: string;
}

export function CambiarEstadoDespachoDialog({
  open,
  onOpenChange,
  despachoId,
  pedidoId,
  estadoObjetivo,
  estadoActual,
  perfilAyudante,
  onSuccess,
  inline = false,
  className,
}: CambiarEstadoDespachoDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [notas, setNotas] = useState('');
  const [repartidor, setRepartidor] = useState('');
  const [placaVehiculo, setPlacaVehiculo] = useState('');
  const [fotos, setFotos] = useState<{ file: File; preview: string }[]>([]);
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const estadoMeta = useMemo(
    () => (estadoObjetivo ? ESTADOS_DESPACHO[estadoObjetivo] : null),
    [estadoObjetivo],
  );

  const requiereDatosAlmacen = estadoObjetivo === 'en_almacen';

  useEffect(() => {
    if (!open && !inline) return;

    setNotas('');
    setError('');
    setFotos([]);
    setSubiendo(false);
    setEnviando(false);
    setRepartidor(perfilAyudante?.nombreCompleto ?? '');
    setPlacaVehiculo(perfilAyudante?.placaVehiculo ?? '');
  }, [open, inline, perfilAyudante, estadoObjetivo]);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (fotos.length + files.length > 5) {
      setError('Máximo 5 imágenes de evidencia.');
      e.target.value = '';
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes como evidencia.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Cada imagen no debe superar 5 MB.');
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFotos((prev) => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    }

    setError('');
    e.target.value = '';
  };

  const quitarFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const cerrar = () => {
    if (subiendo || enviando) return;
    onOpenChange?.(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!estadoObjetivo || !ESTADOS_PERMITIDOS.includes(estadoObjetivo)) {
      setError('Seleccione un estado válido.');
      return;
    }

    const notasTrimmed = notas.trim();
    if (!notasTrimmed) {
      setError('La observación es obligatoria.');
      return;
    }

    if (fotos.length === 0) {
      setError('Debe adjuntar al menos una imagen de evidencia.');
      return;
    }

    if (requiereDatosAlmacen) {
      if (!repartidor.trim()) {
        setError('El repartidor es obligatorio para en_almacen.');
        return;
      }
      if (!placaVehiculo.trim()) {
        setError('La placa del vehículo es obligatoria para en_almacen.');
        return;
      }
    }

    try {
      setSubiendo(true);
      const evidencias: string[] = [];
      for (const foto of fotos) {
        const url = await subirFotoEntrega(pedidoId, foto.file);
        evidencias.push(url);
      }
      setSubiendo(false);
      setEnviando(true);

      const response = await fetch(`/api/admin/despachos/${despachoId}/estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: estadoObjetivo,
          notas: notasTrimmed,
          evidencias,
          repartidor: requiereDatosAlmacen ? repartidor.trim() : undefined,
          placa_vehiculo: requiereDatosAlmacen ? placaVehiculo.trim() : undefined,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'No se pudo actualizar el estado');
      }

      toast.success('Estado actualizado correctamente');
      onSuccess?.();
      onOpenChange?.(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el cambio de estado.');
    } finally {
      setSubiendo(false);
      setEnviando(false);
    }
  };

  const busy = subiendo || enviando;

  const contenido = (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-black text-stone-900 uppercase tracking-tight">
          Registrar cambio de estado
        </DialogTitle>
        <DialogDescription className="text-sm text-stone-500">
          El despacho está actualmente en {estadoActual.replace(/_/g, ' ')}. El cambio a{' '}
          {estadoMeta?.label ?? estadoObjetivo ?? 'nuevo estado'} requiere evidencias y observación.
        </DialogDescription>
      </DialogHeader>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {estadoObjetivo && (
          <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                Estado seleccionado
              </p>
              <p className="mt-1 text-sm font-bold text-stone-900">
                {estadoMeta?.label ?? estadoObjetivo}
              </p>
            </div>
            <span className="rounded-full border border-stone-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-stone-500">
              {estadoObjetivo.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {requiereDatosAlmacen && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="repartidor">Repartidor</Label>
              <Input
                id="repartidor"
                value={repartidor}
                onChange={(event) => setRepartidor(event.target.value)}
                placeholder="Nombre del ayudante o repartidor"
                className="rounded-2xl"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="placaVehiculo">Placa del vehículo</Label>
              <Input
                id="placaVehiculo"
                value={placaVehiculo}
                onChange={(event) => setPlacaVehiculo(event.target.value.toUpperCase())}
                placeholder="ABC-123"
                className="rounded-2xl uppercase"
                disabled={busy}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notas">Observación / motivo</Label>
          <Textarea
            id="notas"
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            placeholder="Explique por qué se realiza este cambio de estado..."
            rows={4}
            className="rounded-2xl resize-none"
            disabled={busy}
          />
        </div>

        <div className="space-y-2">
          <Label>Evidencias fotográficas</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            multiple
            onChange={handleFoto}
            className="hidden"
          />
          <div className="flex flex-wrap gap-3">
            {fotos.map((foto, index) => (
              <div key={`${foto.file.name}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                <Image src={foto.preview} alt="Evidencia" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => quitarFoto(index)}
                  className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                  aria-label="Eliminar evidencia"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {fotos.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-stone-500 transition-colors hover:bg-stone-100"
                disabled={busy}
              >
                <Plus className="h-5 w-5" />
                <span className="mt-1 text-[10px] font-black uppercase tracking-widest">Añadir</span>
              </button>
            )}
          </div>
          <p className="text-[11px] font-medium text-stone-400">
            Adjunte al menos una imagen. Puede cargar hasta 5.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!inline && (
            <Button type="button" variant="outline" className="rounded-2xl" onClick={cerrar} disabled={busy}>
              Cancelar
            </Button>
          )}
          <Button type="submit" className="rounded-2xl bg-stone-900 hover:bg-stone-800" disabled={busy}>
            <span className="inline-flex items-center gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambio
            </span>
          </Button>
        </DialogFooter>
      </form>
    </>
  );

  if (inline) {
    return <div className={className}>{contenido}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[92vh] overflow-y-auto border-stone-100 bg-white/95 backdrop-blur-xl">
        {contenido}
      </DialogContent>
    </Dialog>
  );
}
