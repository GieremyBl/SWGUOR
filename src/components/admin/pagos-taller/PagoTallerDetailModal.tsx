'use client';

import { useEffect, useState } from 'react';
import { Coins, Loader2, X } from 'lucide-react';
import {
  ESTADO_PAGO_TALLER_LABELS,
  METODO_PAGO_TALLER_LABELS,
} from '@/lib/constants/pagos-taller';
import { formatMontoPagoTaller } from '@/lib/helpers/pagos-taller-helpers';
import type { PagoTallerFila } from '@/lib/schemas/pagos-talleres';
import type { MetodoPago } from '@prisma/client';

interface Props {
  open: boolean;
  pagoId: string | number | null;
  canGestionar: boolean;
  isRegistering: boolean;
  isAnulling: boolean;
  onClose: () => void;
  onLoad: (id: string | number) => Promise<PagoTallerFila>;
  onRegistrar: (
    id: string | number,
    data: { numero_operacion?: string; comprobante_url?: string; notas?: string },
  ) => Promise<void>;
  onAnular: (id: string | number, data?: { notas?: string }) => Promise<void>;
}

function formatFecha(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE');
}

export function PagoTallerDetailModal({
  open,
  pagoId,
  canGestionar,
  isRegistering,
  isAnulling,
  onClose,
  onLoad,
  onRegistrar,
  onAnular,
}: Props) {
  const [detalle, setDetalle] = useState<PagoTallerFila | null>(null);
  const [loading, setLoading] = useState(false);
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !pagoId) {
      setDetalle(null);
      setNumeroOperacion('');
      setComprobanteUrl('');
      setNotas('');
      setError('');
      return;
    }

    let mounted = true;
    setLoading(true);
    onLoad(pagoId)
      .then((data) => {
        if (!mounted) return;
        setDetalle(data);
        setNumeroOperacion(data.numero_operacion ?? '');
        setComprobanteUrl(data.comprobante_url ?? '');
        setNotas(data.notas ?? '');
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open, pagoId, onLoad]);

  if (!open) return null;

  const pendiente = detalle?.estado === 'pendiente';
  const pagado = detalle?.estado === 'pagado';
  const anulado = detalle?.estado === 'anulado';

  const handleRegistrar = async () => {
    if (!pagoId) return;
    setError('');
    try {
      await onRegistrar(pagoId, {
        numero_operacion: numeroOperacion || undefined,
        comprobante_url: comprobanteUrl || undefined,
        notas: notas || undefined,
      });
      const actualizado = await onLoad(pagoId);
      setDetalle(actualizado);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar el pago');
    }
  };

  const handleAnular = async () => {
    if (!pagoId) return;
    setError('');
    try {
      await onAnular(pagoId, { notas: notas || undefined });
      const actualizado = await onLoad(pagoId);
      setDetalle(actualizado);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo anular el pago');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Pago #{pagoId}</h2>
              <p className="text-xs text-slate-500">Detalle y confirmación de pago</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex justify-center py-12 text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Cargando...
            </div>
          ) : detalle ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Taller</p>
                  <p className="font-medium text-slate-800 mt-1">{detalle.talleres?.nombre ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Monto</p>
                  <p className="font-bold text-slate-900 mt-1">
                    {formatMontoPagoTaller(detalle.monto, detalle.moneda)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Estado</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {ESTADO_PAGO_TALLER_LABELS[detalle.estado]}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Método</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {METODO_PAGO_TALLER_LABELS[detalle.metodo_pago as MetodoPago]}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Fecha pago</p>
                  <p className="font-medium text-slate-800 mt-1">{formatFecha(detalle.fecha_pago)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Registrado por</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {detalle.usuarios?.email ?? '—'}
                  </p>
                </div>
                {detalle.confecciones && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Confección</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {detalle.confecciones.prenda ?? `#${detalle.confeccion_id}`}
                    </p>
                  </div>
                )}
                {detalle.ordenes_produccion && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Orden producción</p>
                    <p className="font-medium text-slate-800 mt-1">#{detalle.orden_produccion_id}</p>
                  </div>
                )}
              </div>

              {detalle.notas && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Notas</p>
                  <div className="bg-slate-50 border rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
                    {detalle.notas}
                  </div>
                </div>
              )}

              {canGestionar && pendiente && (
                <div className="border-t pt-5 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Confirmar pago realizado</h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">
                      Nº operación / voucher
                    </label>
                    <input
                      value={numeroOperacion}
                      onChange={(e) => setNumeroOperacion(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">
                      URL comprobante
                    </label>
                    <input
                      value={comprobanteUrl}
                      onChange={(e) => setComprobanteUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRegistrar}
                    disabled={isRegistering}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
                  >
                    {isRegistering ? 'Confirmando...' : 'Marcar como pagado'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAnular}
                    disabled={isAnulling}
                    className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-700 text-sm font-bold disabled:opacity-50"
                  >
                    {isAnulling ? 'Anulando...' : 'Anular pago'}
                  </button>
                </div>
              )}

              {canGestionar && pagado && (
                <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-4">
                  Este pago ya fue confirmado. Operación: {detalle.numero_operacion ?? '—'}
                </p>
              )}

              {anulado && (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">
                  Este pago fue anulado y no admite más acciones.
                </p>
              )}

              {error && <p className="text-sm text-rose-600">{error}</p>}
            </>
          ) : (
            <p className="text-sm text-rose-600">{error || 'No se pudo cargar el pago'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
