'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, Loader2, Plus, Upload, X } from 'lucide-react';
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
import { MOTIVO_DEVOLUCION_LABELS } from '@/lib/constants/devoluciones-cliente';
import { uploadEvidenciaSoporte } from '@/lib/helpers/soporte-portal-helpers';
import type { CrearDevolucionClientePortalInput } from '@/lib/schemas/soporte-portal';
import type { PedidoEntregadoPortal } from '@/lib/schemas/soporte-portal';
import type { MotivoDevolucion } from '@prisma/client';

const MOTIVOS = Object.entries(MOTIVO_DEVOLUCION_LABELS) as [MotivoDevolucion, string][];

interface SolicitarDevolucionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosEntregados: PedidoEntregadoPortal[];
  isLoadingPedidos?: boolean;
  onSubmit: (payload: CrearDevolucionClientePortalInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function SolicitarDevolucionModal({
  open,
  onOpenChange,
  pedidosEntregados,
  isLoadingPedidos,
  onSubmit,
  isSubmitting,
}: SolicitarDevolucionModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pedidoId, setPedidoId] = useState('');
  const [pedidoItemId, setPedidoItemId] = useState('');
  const [motivo, setMotivo] = useState<MotivoDevolucion>('defecto_fabrica');
  const [cantidad, setCantidad] = useState('1');
  const [notas, setNotas] = useState('');
  const [fotos, setFotos] = useState<{ file: File; preview: string }[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const pedidoSeleccionado = pedidosEntregados.find((p) => p.id === pedidoId);
  const items = pedidoSeleccionado?.pedido_items ?? [];
  const itemSeleccionado = items.find((i) => i.id === pedidoItemId);
  const maxCantidad = itemSeleccionado?.cantidad ?? 1;

  useEffect(() => {
    if (!open) {
      setPedidoId('');
      setPedidoItemId('');
      setMotivo('defecto_fabrica');
      setCantidad('1');
      setNotas('');
      setFotos([]);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    setPedidoItemId('');
    setCantidad('1');
  }, [pedidoId]);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fotos.length >= 5) {
      setError('Máximo 5 fotos de evidencia.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Cada foto no debe superar 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFotos((prev) => [...prev, { file, preview: reader.result as string }]);
    };
    reader.readAsDataURL(file);
    setError('');
    e.target.value = '';
  };

  const quitarFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pedidoNum = Number(pedidoId);
    const itemNum = Number(pedidoItemId);
    const cantidadNum = Number(cantidad);

    if (!pedidoId || Number.isNaN(pedidoNum)) {
      setError('Seleccione un pedido entregado.');
      return;
    }
    if (!pedidoItemId || Number.isNaN(itemNum)) {
      setError('Seleccione el producto a devolver.');
      return;
    }
    if (Number.isNaN(cantidadNum) || cantidadNum <= 0 || cantidadNum > maxCantidad) {
      setError(`Indique una cantidad entre 1 y ${maxCantidad}.`);
      return;
    }

    try {
      setUploading(true);
      const fotos_url: string[] = [];
      for (const foto of fotos) {
        const url = await uploadEvidenciaSoporte(pedidoNum, foto.file, 'devoluciones');
        fotos_url.push(url);
      }

      await onSubmit({
        pedido_id: pedidoNum,
        pedido_item_id: itemNum,
        motivo,
        cantidad: cantidadNum,
        notas_cliente: notas.trim() || undefined,
        fotos_url,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
    } finally {
      setUploading(false);
    }
  };

  const busy = isSubmitting || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar devolución</DialogTitle>
          <DialogDescription>
            Solo puede devolver productos de pedidos ya entregados.
          </DialogDescription>
        </DialogHeader>

        {isLoadingPedidos ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando pedidos entregados...
          </div>
        ) : pedidosEntregados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No tiene pedidos entregados disponibles para solicitar devolución.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pedido entregado</Label>
              <select
                value={pedidoId}
                onChange={(e) => setPedidoId(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">Seleccione un pedido</option>
                {pedidosEntregados.map((p) => (
                  <option key={p.id} value={p.id}>
                    Pedido #{p.id}
                    {p.created_at
                      ? ` · ${new Date(p.created_at).toLocaleDateString('es-PE')}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            {pedidoId && (
              <div className="space-y-2">
                <Label>Producto a devolver</Label>
                <select
                  value={pedidoItemId}
                  onChange={(e) => setPedidoItemId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Seleccione un ítem</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.productos?.nombre ?? 'Producto'} · {item.variantes_producto?.color ?? '—'}{' '}
                      / {item.variantes_producto?.talla ?? 'U'} (máx. {item.cantidad} uds)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo</Label>
                <select
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value as MotivoDevolucion)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {MOTIVOS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min={1}
                  max={maxCantidad}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas adicionales (opcional)</Label>
              <Textarea
                id="notas"
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="rounded-xl resize-none"
                placeholder="Detalle el motivo de la devolución..."
              />
            </div>

            <div className="space-y-2">
              <Label>Fotos de evidencia (opcional, máx. 5)</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFoto}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                {fotos.map((foto, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <Image src={foto.preview} alt="" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => quitarFoto(index)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {fotos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[9px] mt-1 font-bold">Añadir</span>
                  </button>
                )}
              </div>
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
              <Button type="submit" className="rounded-xl bg-rose-500 hover:bg-rose-600" disabled={busy}>
                <span className="inline-flex items-center">
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enviar solicitud
                </span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
