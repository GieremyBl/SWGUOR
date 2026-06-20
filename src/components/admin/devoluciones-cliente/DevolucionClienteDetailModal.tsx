'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CONDICION_PRODUCTO_LABELS,
  ESTADO_DEVOLUCION_LABELS,
  ESTADO_DEVOLUCION_STYLES,
  MOTIVO_DEVOLUCION_LABELS,
} from '@/lib/constants/devoluciones-cliente';
import type { DevolucionClienteFila } from '@/lib/schemas/devoluciones-cliente';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devolucionId: string | number | null;
  canResolver: boolean;
  onLoad: (id: string | number) => Promise<DevolucionClienteFila>;
  onAprobar: (id: string | number, data: { notas_internas?: string; monto_reembolsado?: number }) => Promise<void>;
  onRechazar: (id: string | number, data: { notas_internas?: string }) => Promise<void>;
  isResolving?: boolean;
}

function Campo({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5">{value ?? '—'}</p>
    </div>
  );
}

export function DevolucionClienteDetailModal({
  open,
  onOpenChange,
  devolucionId,
  canResolver,
  onLoad,
  onAprobar,
  onRechazar,
  isResolving,
}: Props) {
  const [detalle, setDetalle] = useState<DevolucionClienteFila | null>(null);
  const [loading, setLoading] = useState(false);
  const [notasInternas, setNotasInternas] = useState('');
  const [montoReembolso, setMontoReembolso] = useState('');

  const esPendiente =
    detalle?.estado_solicitud === 'pendiente' || detalle?.estado_solicitud === 'en_revision';

  useEffect(() => {
    if (!open || !devolucionId) {
      setDetalle(null);
      setNotasInternas('');
      setMontoReembolso('');
      return;
    }

    const cargar = async () => {
      setLoading(true);
      try {
        const data = await onLoad(devolucionId);
        setDetalle(data);
        setNotasInternas(data.notas_internas ?? '');
        setMontoReembolso(
          data.monto_reembolsado != null ? String(data.monto_reembolsado) : '',
        );
      } finally {
        setLoading(false);
      }
    };

    void cargar();
  }, [open, devolucionId, onLoad]);

  const handleAprobar = async () => {
    if (!devolucionId) return;
    await onAprobar(devolucionId, {
      notas_internas: notasInternas.trim() || undefined,
      monto_reembolsado: montoReembolso ? Number(montoReembolso) : undefined,
    });
    onOpenChange(false);
  };

  const handleRechazar = async () => {
    if (!devolucionId) return;
    await onRechazar(devolucionId, {
      notas_internas: notasInternas.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Devolución #{devolucionId}
            {detalle && (
              <Badge variant="outline" className={ESTADO_DEVOLUCION_STYLES[detalle.estado_solicitud]}>
                {ESTADO_DEVOLUCION_LABELS[detalle.estado_solicitud]}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : detalle ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Campo
                label="Cliente"
                value={
                  detalle.clientes?.razon_social ??
                  detalle.clientes?.nombre_comercial ??
                  String(detalle.cliente_id)
                }
              />
              <Campo label="Pedido" value={detalle.pedido_id ? `#${detalle.pedido_id}` : null} />
              <Campo label="Producto" value={detalle.productos?.nombre} />
              <Campo
                label="Variante"
                value={
                  detalle.variantes_producto
                    ? `${detalle.variantes_producto.talla} / ${detalle.variantes_producto.color}`
                    : null
                }
              />
              <Campo label="Motivo" value={MOTIVO_DEVOLUCION_LABELS[detalle.motivo]} />
              <Campo label="Cantidad" value={detalle.cantidad} />
              <Campo
                label="Condición"
                value={
                  detalle.condicion_recibido
                    ? CONDICION_PRODUCTO_LABELS[detalle.condicion_recibido]
                    : null
                }
              />
              <Campo
                label="Monto reembolsado"
                value={
                  detalle.monto_reembolsado != null
                    ? `S/ ${Number(detalle.monto_reembolsado).toFixed(2)}`
                    : null
                }
              />
            </div>

            <Campo label="Notas del cliente" value={detalle.notas_cliente} />

            {canResolver && esPendiente ? (
              <div className="space-y-3 border-t pt-4">
                <div className="space-y-2">
                  <Label>Notas internas</Label>
                  <Textarea
                    value={notasInternas}
                    onChange={(e) => setNotasInternas(e.target.value)}
                    rows={3}
                    placeholder="Observaciones del equipo al resolver..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto a reembolsar (S/)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={montoReembolso}
                    onChange={(e) => setMontoReembolso(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : (
              <Campo label="Notas internas" value={detalle.notas_internas} />
            )}
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {canResolver && esPendiente && detalle && (
            <>
              <Button
                variant="destructive"
                onClick={() => void handleRechazar()}
                disabled={isResolving}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rechazar
              </Button>
              <Button onClick={() => void handleAprobar()} disabled={isResolving}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Aprobar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
