'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PedidoTracker } from '@/components/portal/pedidos/PedidoTracker';
import { TabGuiaRemision } from '@/components/admin/pedidos/detalles/TabGuiaRemision';
import { CambiarEstadoDespachoDialog } from './CambiarEstadoDespachoDialog';
import { ESTADOS_DESPACHO } from '@/lib/constants/estados';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { EstadoDespacho } from '@prisma/client';

const ESTADOS_CAMBIO: EstadoDespacho[] = [
  'pendiente',
  'en_ruta',
  'entregado',
  'preparando',
  'incidencia',
  'en_almacen',
  'devuelto',
];

interface DespachoDetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  despacho: {
    id: number;
    despacho_id: string;
    pedido_id: string;
    cliente: string;
    direccion: string;
    cantidad_pedida: number;
    estado: string;
    tracking: string;
    fecha_despacho: string;
    fecha_entrega: string;
  };
  perfilAyudante?: { nombreCompleto: string | null; placaVehiculo: string | null } | null;
  onSuccess: () => void;
}

export function DespachoDetalleDialog({
  open,
  onOpenChange,
  despacho,
  perfilAyudante,
  onSuccess,
}: DespachoDetalleDialogProps) {
  const { role } = usePermissions();
  const [activeTab, setActiveTab] = useState<'seguimiento' | 'guia'>('seguimiento');
  const [guias, setGuias] = useState<any[]>([]);
  const [loadingGuias, setLoadingGuias] = useState(false);
  const [estadoObjetivo, setEstadoObjetivo] = useState<EstadoDespacho | null>(null);

  const estadoActual = despacho.estado;
  const guiaPedidoLike = useMemo(
    () => ({
      id: despacho.pedido_id,
      guias_remision: guias,
    }),
    [despacho.pedido_id, guias],
  );

  useEffect(() => {
    if (!open) return;

    const cargarGuias = async () => {
      setLoadingGuias(true);
      try {
        const res = await fetch(`/api/admin/despachos/${despacho.id}/guias-remision`, {
          cache: 'no-store',
        });
        const json = await res.json().catch(() => null);
        if (res.ok && Array.isArray(json.data)) {
          setGuias(json.data);
        } else {
          setGuias([]);
        }
      } catch {
        setGuias([]);
      } finally {
        setLoadingGuias(false);
      }
    };

    void cargarGuias();
  }, [open, despacho.pedido_id]);

  const estadosDisponibles = ESTADOS_CAMBIO.filter((estado) => estado !== estadoActual);

  const puedeGestionar = ['ayudante', 'administrador', 'gerente'].includes(String(role ?? ''));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl rounded-3xl max-h-[92vh] overflow-y-auto border-stone-100 bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-stone-900 uppercase tracking-tight">
              {despacho.despacho_id}
            </DialogTitle>
            <DialogDescription>
              {despacho.cliente} · Pedido #{despacho.pedido_id} · {ESTADOS_DESPACHO[estadoActual as keyof typeof ESTADOS_DESPACHO]?.label ?? estadoActual}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <div className="space-y-2 text-sm text-stone-700">
              <p><span className="font-bold text-stone-900">Dirección:</span> {despacho.direccion}</p>
              <p><span className="font-bold text-stone-900">Entrega:</span> {despacho.fecha_entrega}</p>
              <p><span className="font-bold text-stone-900">Tracking:</span> {despacho.tracking}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={activeTab === 'seguimiento' ? 'default' : 'outline'}
              onClick={() => setActiveTab('seguimiento')}
              className="rounded-xl"
            >
              <Route className="mr-2 h-4 w-4" />
              Seguimiento
            </Button>
            <Button
              type="button"
              variant={activeTab === 'guia' ? 'default' : 'outline'}
              onClick={() => setActiveTab('guia')}
              className="rounded-xl"
            >
              <FileText className="mr-2 h-4 w-4" />
              Guía
            </Button>
          </div>

          {activeTab === 'seguimiento' ? (
            <div className="space-y-4 rounded-2xl border border-stone-100 bg-white p-4">
              {puedeGestionar && (
                <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500">
                      Cambiar estado
                    </label>
                    <select
                      value={estadoObjetivo ?? ''}
                      onChange={(event) => setEstadoObjetivo((event.target.value || null) as EstadoDespacho | null)}
                      className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold uppercase tracking-widest text-stone-700"
                    >
                      <option value="">Seleccionar</option>
                      {estadosDisponibles.map((estado) => (
                        <option key={estado} value={estado}>
                          {ESTADOS_DESPACHO[estado as keyof typeof ESTADOS_DESPACHO]?.label ?? estado}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEstadoObjetivo('cancelado')}
                      className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Cancelar despacho
                    </Button>
                  </div>

                  {estadoObjetivo ? (
                    <CambiarEstadoDespachoDialog
                      inline
                      className="space-y-4"
                      despachoId={despacho.id}
                      pedidoId={despacho.pedido_id}
                      estadoObjetivo={estadoObjetivo}
                      estadoActual={estadoActual}
                      perfilAyudante={perfilAyudante}
                      onSuccess={onSuccess}
                    />
                  ) : (
                    <p className="text-sm text-stone-500">
                      Selecciona un estado para registrar observación y evidencias.
                    </p>
                  )}
                </div>
              )}

              <PedidoTracker pedidoId={despacho.pedido_id} variant="admin" />
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-100 bg-white p-4">
              {loadingGuias ? (
                <p className="text-sm text-stone-500">Cargando guía...</p>
              ) : (
                  <TabGuiaRemision
                    pedido={guiaPedidoLike}
                    pdfFallbackUrl={`/api/admin/despachos/${despacho.id}/guias-remision/pdf`}
                  />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
