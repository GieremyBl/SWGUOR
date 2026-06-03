'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Loader2,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  fetchCotizacionById,
  aprobarCotizacion,
  rechazarCotizacion,
} from '@/lib/helpers/cotizaciones-helpers';
import type { CotizacionDetalleAdmin } from '@/lib/services/cotizaciones.service';

type Props = {
  cotizacionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CotizacionDetalleModal({
  cotizacionId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [detalle, setDetalle] = useState<CotizacionDetalleAdmin | null>(null);
  const [loading, setLoading] = useState(false);
  const [accionando, setAccionando] = useState(false);
  const [precios, setPrecios] = useState<Record<number, string>>({});
  const [rejectOpen, setRejectOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  useEffect(() => {
    if (!open || !cotizacionId) {
      setDetalle(null);
      setPrecios({});
      return;
    }

    let activo = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchCotizacionById(String(cotizacionId));
        if (!activo) return;
        setDetalle(data);
        const iniciales: Record<number, string> = {};
        for (const item of data.items ?? []) {
          iniciales[item.id] = String(item.precio_unitario);
        }
        setPrecios(iniciales);
      } catch {
        if (activo) toast.error('No se pudo cargar el detalle');
      } finally {
        if (activo) setLoading(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [open, cotizacionId]);

  const puedeGestionar = detalle?.estado === 'enviada';

  const resumen = useMemo(() => {
    if (!detalle) return { subtotal: 0, igv: 0, total: 0 };
    const subtotal = detalle.items.reduce((acc, item) => {
      const raw = precios[item.id];
      const precio = raw !== undefined ? parseFloat(raw) : item.precio_unitario;
      const unit = Number.isNaN(precio) || precio <= 0 ? item.precio_unitario : precio;
      return acc + unit * item.cantidad;
    }, 0);
    const neto = Math.max(0, subtotal - detalle.monto_descuento);
    const igv = neto * 0.18;
    const total = neto + igv + detalle.costo_envio;
    return { subtotal, igv, total };
  }, [detalle, precios]);

  const handleAprobar = async () => {
    if (!detalle || !cotizacionId) return;

    const itemsPayload = detalle.items.map((item) => {
      const raw = precios[item.id];
      const parsed = raw !== undefined ? parseFloat(raw) : item.precio_unitario;
      const precio =
        Number.isNaN(parsed) || parsed <= 0 ? item.precio_unitario : parsed;
      return { item_id: item.id, precio_unitario: precio };
    });

    try {
      setAccionando(true);
      const result = await aprobarCotizacion(String(cotizacionId), itemsPayload);
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo aprobar');
        return;
      }
      toast.success(
        result.pedidoId
          ? `Cotización aprobada — Pedido #${result.pedidoId} creado`
          : 'Cotización aprobada',
      );
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Error al aprobar');
    } finally {
      setAccionando(false);
    }
  };

  const handleRechazar = async () => {
    if (!cotizacionId) return;
    try {
      setAccionando(true);
      const result = await rechazarCotizacion(
        String(cotizacionId),
        motivoRechazo.trim() || undefined,
      );
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo rechazar');
        return;
      }
      toast.success('Cotización rechazada');
      setRejectOpen(false);
      setMotivoRechazo('');
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Error al rechazar');
    } finally {
      setAccionando(false);
    }
  };

  const notasCliente = detalle?.notas_internas?.replace(/\[ERP_META\]:[\s\S]*/g, '').trim();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
              <Eye className="w-5 h-5 text-indigo-600" />
              Detalle de cotización
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {detalle?.numero ?? 'Cargando…'}
              {detalle?.origen && (
                <Badge variant="outline" className="ml-2 text-[10px] uppercase">
                  {detalle.origen}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : !detalle ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No se encontró la cotización.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Building2 size={12} /> Cliente
                  </p>
                  <p className="font-bold text-slate-900">
                    {detalle.cliente?.razon_social ??
                      detalle.cliente?.nombre_comercial ??
                      'Cliente manual'}
                  </p>
                  <p className="text-sm text-slate-600">
                    RUC/DNI: {detalle.cliente?.ruc ?? '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> Fechas
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Solicitud:</span>{' '}
                    {detalle.created_at
                      ? new Date(detalle.created_at).toLocaleString('es-PE')
                      : '—'}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Vence:</span> {detalle.valida_hasta}
                  </p>
                  <Badge className="mt-1 uppercase text-[10px]">{detalle.estado}</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-slate-700 font-bold">Producto</TableHead>
                      <TableHead className="text-slate-700 font-bold">Variante</TableHead>
                      <TableHead className="text-center text-slate-700 font-bold">Cant.</TableHead>
                      <TableHead className="text-right text-slate-700 font-bold">Precio unitario</TableHead>
                      <TableHead className="text-right text-slate-700 font-bold">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalle.items.map((item) => {
                      const raw = precios[item.id];
                      const precio =
                        raw !== undefined ? parseFloat(raw) : item.precio_unitario;
                      const unit =
                        Number.isNaN(precio) || precio <= 0
                          ? item.precio_unitario
                          : precio;
                      return (
                        <TableRow key={item.id} className="bg-white">
                          <TableCell className="text-slate-900">
                            <p className="font-semibold text-sm text-slate-900">{item.producto_nombre}</p>
                            <p className="text-[10px] text-slate-500">{item.producto_sku}</p>
                          </TableCell>
                          <TableCell className="text-sm text-slate-800">
                            {item.color} · {item.talla}
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-900">
                            {item.cantidad}
                          </TableCell>
                          <TableCell className="text-right text-slate-900">
                            {puedeGestionar ? (
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                className="h-9 w-28 ml-auto text-right font-bold text-slate-900 bg-white border-slate-300"
                                value={precios[item.id] ?? ''}
                                onChange={(e) =>
                                  setPrecios((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                              />
                            ) : (
                              <span className="font-bold text-slate-900">
                                S/ {unit.toFixed(2)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900">
                            S/ {(unit * item.cantidad).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-4 text-sm text-slate-800">
                <p>
                  Subtotal ref.:{' '}
                  <strong className="text-slate-900">S/ {resumen.subtotal.toFixed(2)}</strong>
                </p>
                <p>
                  IGV: <strong className="text-slate-900">S/ {resumen.igv.toFixed(2)}</strong>
                </p>
                <p>
                  Total: <strong className="text-slate-900">S/ {resumen.total.toFixed(2)}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                  <MessageSquare size={14} />
                  Mensaje / notas del cliente
                </Label>
                <div className="min-h-[80px] p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 whitespace-pre-wrap">
                  {notasCliente || 'Sin mensaje adjunto.'}
                </div>
              </div>
            </div>
          )}

          {detalle && puedeGestionar && (
            <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase text-xs"
                disabled={accionando}
                onClick={() => setRejectOpen(true)}
              >
                <XCircle size={14} className="mr-1" />
                Rechazar
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs"
                disabled={accionando || detalle.estado === 'expirada'}
                onClick={handleAprobar}
              >
                {accionando ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : (
                  <CheckCircle2 size={14} className="mr-1" />
                )}
                Aprobar cotización
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-red-600">
              Rechazar cotización
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs font-bold uppercase text-slate-500">
              Motivo (opcional)
            </Label>
            <Textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ej.: Precios fuera de política comercial…"
              className="min-h-[100px] rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={accionando}
              onClick={handleRechazar}
            >
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
