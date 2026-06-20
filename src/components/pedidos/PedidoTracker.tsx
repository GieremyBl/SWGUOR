'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PasoTrackerCalculado } from '@/lib/helpers/pedido-tracker.helper';
import {
  DireccionDespachoPeruFields,
} from '@/components/shared/DireccionDespachoPeruFields';
import { formatearVistaDireccionDespacho } from '@/lib/helpers/direccion-despacho-peru.helper';

interface HistorialItem {
  id: number;
  status: string;
  notas: string | null;
  created_at: string | null;
}

interface TrackerData {
  pedido_id: number;
  codigo: string;
  estado: string;
  direccion_despacho: string | null;
  puede_editar_direccion: boolean;
  modo: 'cliente' | 'staff';
  pasos: PasoTrackerCalculado[];
  fecha_entrega_texto: string | null;
  fecha_entrega_pendiente: boolean;
  historial: HistorialItem[];
}

interface PedidoTrackerProps {
  pedidoId: number | string;
  className?: string;
  /** Variante visual: portal (dorado) o admin (neutro). */
  variant?: 'portal' | 'admin';
}

export function PedidoTracker({
  pedidoId,
  className,
  variant = 'portal',
}: PedidoTrackerProps) {
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [direccion, setDireccion] = useState('');
  const [direccionValida, setDireccionValida] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/tracker`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'No se pudo cargar el seguimiento');
      }
      const payload = json.data as TrackerData;
      setData(payload);
      setDireccion(payload.direccion_despacho ?? '');
      setDireccionValida(Boolean(payload.direccion_despacho));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleGuardarDireccion = async () => {
    try {
      setGuardando(true);
      const res = await fetch(`/api/pedidos/${pedidoId}/direccion`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direccion_despacho: direccion }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.mensaje ?? json.error ?? 'Error al guardar');
      }
      toast.success('Dirección actualizada');
      await cargar();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const accent =
    variant === 'admin'
      ? { completado: 'bg-emerald-600 border-emerald-600', actual: 'border-blue-600 text-blue-600 ring-blue-100', linea: 'bg-emerald-600' }
      : { completado: 'bg-[#B8962D] border-[#B8962D]', actual: 'border-[#B8962D] text-[#B8962D] ring-amber-100', linea: 'bg-[#B8962D]' };

  if (loading) {
    return (
      <div className={cn('flex justify-center py-12', className)}>
        <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn('rounded-xl border border-rose-100 bg-rose-50 p-6 text-center', className)}>
        <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-rose-700 font-medium">{error ?? 'Sin datos'}</p>
        <button
          type="button"
          onClick={cargar}
          className="mt-2 text-xs font-bold text-rose-600 uppercase hover:underline inline-flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Reintentar
        </button>
      </div>
    );
  }

  const progresoPct =
    data.pasos.length > 1
      ? (data.pasos.filter((p) => p.estadoVisual === 'completado').length /
        (data.pasos.length - 1)) *
      100
      : 0;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {data.codigo}
        </p>
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Entrega estimada: </span>
          {data.fecha_entrega_pendiente
            ? 'Fecha por confirmar'
            : data.fecha_entrega_texto}
        </p>
      </div>

      <div className="relative px-2 py-4">
        <div className="absolute top-8 left-8 right-8 h-0.5 bg-slate-100 hidden sm:block">
          <div
            className={cn('h-full transition-all duration-700', accent.linea)}
            style={{ width: `${Math.min(100, progresoPct)}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2">
          {data.pasos.map((paso) => {
            const esCompletado = paso.estadoVisual === 'completado';
            const esActual = paso.estadoVisual === 'actual';

            return (
              <div
                key={paso.key}
                className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 relative z-10"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    esCompletado && cn(accent.completado, 'text-white'),
                    esActual && cn('bg-white ring-4', accent.actual),
                    !esCompletado && !esActual && 'bg-white border-slate-200 text-slate-300',
                  )}
                >
                  {esCompletado ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : esActual ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                  )}
                </div>
                <div className="text-left sm:text-center min-w-0">
                  <p
                    className={cn(
                      'text-[11px] font-bold uppercase tracking-wide leading-tight',
                      esCompletado && 'text-emerald-700',
                      esActual && 'text-blue-700',
                      !esCompletado && !esActual && 'text-slate-400',
                    )}
                  >
                    {paso.label}
                  </p>
                  {esActual && (
                    <p className="text-[9px] font-bold text-blue-500 uppercase mt-0.5">
                      En curso
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(data.direccion_despacho || data.puede_editar_direccion) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            Dirección de despacho
          </p>
          {data.puede_editar_direccion ? (
            <>
              <p className="text-xs text-emerald-800 font-medium">
                {data.estado === 'listo_para_despacho'
                  ? 'Confirme o actualice su dirección antes del envío.'
                  : 'Indique dónde desea recibir su pedido. Puede modificarla en cualquier momento antes del despacho.'}
              </p>
              <div className="text-slate-900 [&_label]:text-slate-900 [&_input]:text-slate-900 [&_select]:text-slate-900">
                <DireccionDespachoPeruFields
                  value={direccion}
                  onChange={setDireccion}
                  onValidityChange={setDireccionValida}
                  variant={variant === 'portal' ? 'portal' : 'admin'}
                />
              </div>
              <button
                type="button"
                onClick={handleGuardarDireccion}
                disabled={guardando || !direccionValida}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase disabled:opacity-50"
              >
                {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar dirección
              </button>
            </>
          ) : data.direccion_despacho ? (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Solo lectura
              </p>
              <p className="text-sm text-slate-800">
                {formatearVistaDireccionDespacho(data.direccion_despacho)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Sin dirección registrada.
            </p>
          )}
        </div>
      )}

      {data.historial.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Historial de seguimiento
          </p>
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {data.historial.map((h) => (
              <li
                key={h.id}
                className="text-sm border-l-2 border-slate-300 pl-3 py-1 text-slate-800"
              >
                <p className="font-semibold text-slate-900 capitalize">
                  {String(h.status).replace(/_/g, ' ')}
                </p>
                {h.notas && (
                  <p className="text-xs text-slate-600 mt-0.5">{h.notas}</p>
                )}
                {h.created_at && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(h.created_at).toLocaleString('es-PE')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
