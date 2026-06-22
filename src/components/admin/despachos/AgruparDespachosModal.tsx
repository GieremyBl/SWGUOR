'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, MapPin, Route, Sparkles } from 'lucide-react';
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
import { ordenarDespachosPorProximidad } from '@/lib/helpers/orden-paradas-despacho.helper';

export interface DespachoAgrupable {
  id: number;
  despacho_id: string;
  pedido_id: string;
  cliente: string;
  direccion: string;
  fecha_entrega: string;
}

interface ParadaOrden {
  despacho_id: number;
  despacho_codigo: string;
  pedido_id: string;
  cliente: string;
  direccion: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidatos: DespachoAgrupable[];
  onAgrupado: () => void;
}

export function AgruparDespachosModal({
  open,
  onOpenChange,
  candidatos,
  onAgrupado,
}: Props) {
  const [paradas, setParadas] = useState<ParadaOrden[]>([]);
  const [guardando, setGuardando] = useState(false);

  const inicializarParadas = useCallback(() => {
    const ordenados = ordenarDespachosPorProximidad(
      candidatos.map((c) => ({
        despacho_id: BigInt(c.id),
        direccion_entrega: c.direccion,
      })),
    );

    const mapa = new Map(candidatos.map((c) => [c.id, c]));
    setParadas(
      ordenados
        .map((o) => mapa.get(Number(o.despacho_id)))
        .filter((c): c is DespachoAgrupable => Boolean(c))
        .map((c) => ({
          despacho_id: c.id,
          despacho_codigo: c.despacho_id,
          pedido_id: c.pedido_id,
          cliente: c.cliente,
          direccion: c.direccion,
        })),
    );
  }, [candidatos]);

  useEffect(() => {
    if (open) inicializarParadas();
  }, [open, inicializarParadas]);

  const moverParada = (index: number, direccion: -1 | 1) => {
    setParadas((prev) => {
      const next = [...prev];
      const target = index + direccion;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const sugerirProximidad = () => {
    inicializarParadas();
    toast.message('Orden sugerido: paradas más cercanas primero');
  };

  const payloadParadas = useMemo(
    () =>
      paradas.map((p, index) => ({
        despacho_id: p.despacho_id,
        numero_parada: index + 1,
      })),
    [paradas],
  );

  const handleConfirmar = async () => {
    if (paradas.length < 2) {
      toast.error('Selecciona al menos 2 despachos');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch('/api/admin/despachos/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          despacho_ids: paradas.map((p) => p.despacho_id),
          paradas: payloadParadas,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo agrupar la ruta');

      toast.success(`Ruta creada con ${paradas.length} paradas`);
      onOpenChange(false);
      onAgrupado();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al agrupar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-indigo-600" />
            Agrupar entregas del día
          </DialogTitle>
          <DialogDescription>
            Ordena las paradas de la ruta: primero la más cercana, luego las siguientes.
            Puedes agrupar pedidos de distintos clientes para entregar el mismo día.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={sugerirProximidad}
            className="text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Orden sugerido (cercano → lejano)
          </Button>
        </div>

        <ol className="space-y-3">
          {paradas.map((parada, index) => (
            <li
              key={parada.despacho_id}
              className="flex gap-3 items-start rounded-xl border border-slate-200 bg-slate-50/80 p-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-900">
                  {parada.despacho_codigo} · Pedido #{parada.pedido_id}
                </p>
                <p className="text-xs text-slate-600">{parada.cliente}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{parada.direccion}</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => moverParada(index, -1)}
                  aria-label="Subir parada"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === paradas.length - 1}
                  onClick={() => moverParada(index, 1)}
                  aria-label="Bajar parada"
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ol>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirmar} disabled={guardando}>
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Agrupando...
              </>
            ) : (
              'Confirmar ruta agrupada'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
