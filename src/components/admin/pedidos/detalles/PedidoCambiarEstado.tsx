'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { obtenerEstadosSiguientes } from '@/lib/helpers/pedido-transiciones.helper';
import { ESTADOS_PEDIDO } from '@/lib/constants/estados';
import type { EstadoPedido } from '@prisma/client';

interface PedidoCambiarEstadoProps {
  pedidoId: string;
  estadoActual: string;
}

export function PedidoCambiarEstado({
  pedidoId,
  estadoActual,
}: PedidoCambiarEstadoProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [estadoDestino, setEstadoDestino] = useState<EstadoPedido | null>(null);
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const opciones = obtenerEstadosSiguientes(estadoActual);

  if (opciones.length === 0) return null;

  const abrirConfirmacion = (estado: EstadoPedido) => {
    setEstadoDestino(estado);
    setNotas('');
    setDialogOpen(true);
  };

  const confirmarCambio = async () => {
    if (!estadoDestino) return;
    setEnviando(true);
    try {
      const res = await fetch('/api/admin/seguimiento-pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: pedidoId,
          status: estadoDestino,
          notas: notas.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? 'No se pudo actualizar el estado');
      }
      toast.success('Estado del pedido actualizado');
      setDialogOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            className="gap-2 font-black uppercase text-[10px] tracking-widest h-9"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cambiar estado
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px]">
          {opciones.map((estado) => {
            const info = ESTADOS_PEDIDO[estado];
            return (
              <DropdownMenuItem
                key={estado}
                className="text-sm font-semibold cursor-pointer"
                onClick={() => abrirConfirmacion(estado)}
              >
                {info?.label ?? estado.replace(/_/g, ' ')}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white text-stone-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">
              Confirmar cambio de estado
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600">
            El pedido pasará a:{' '}
            <strong className="text-stone-900">
              {estadoDestino
                ? (ESTADOS_PEDIDO[estadoDestino]?.label ?? estadoDestino)
                : '—'}
            </strong>
          </p>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-stone-500">
              Notas (opcional)
            </Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej.: Inicio de corte en planta…"
              className="min-h-[80px] text-stone-900"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={confirmarCambio} disabled={enviando}>
              {enviando && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
