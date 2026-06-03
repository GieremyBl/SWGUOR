'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Package,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ESTADO_LABELS } from '@/lib/schemas/confecciones';
import type { TallerSelectOption } from '@/lib/helpers/confecciones-list.helper';

export interface PedidoItemAyudante {
  id: string;
  nombre: string;
  sku: string | null;
  color: string | null;
  talla: string | null;
  cantidad: number;
}

export interface ConfeccionAyudanteData {
  id: string;
  estado: string;
  cantidad: number;
  tallerId: string | null;
  pedido: { id: string; cliente: string } | null;
  pedidoItems: PedidoItemAyudante[];
}

interface Props {
  confeccion: ConfeccionAyudanteData;
  talleres: TallerSelectOption[];
}

export function AyudanteConfeccionWorkspace({ confeccion, talleres }: Props) {
  const router = useRouter();
  const [loadingAprobar, setLoadingAprobar] = useState(false);
  const [loadingTaller, setLoadingTaller] = useState(false);
  const [tallerId, setTallerId] = useState(confeccion.tallerId ?? '');

  const completada = confeccion.estado === 'completada';

  const handleTallerChange = async (nuevoTallerId: string) => {
    if (!nuevoTallerId || nuevoTallerId === tallerId) return;

    const anterior = tallerId;
    setTallerId(nuevoTallerId);
    setLoadingTaller(true);

    try {
      const res = await fetch(`/api/ayudante/confecciones/${confeccion.id}/taller`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taller_id: nuevoTallerId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo asignar el taller');

      toast.success(`Taller actualizado: ${json.data?.taller_nombre ?? ''}`);
      router.refresh();
    } catch (e: unknown) {
      setTallerId(anterior);
      toast.error(e instanceof Error ? e.message : 'Error al cambiar taller');
    } finally {
      setLoadingTaller(false);
    }
  };

  const handleAprobar = async () => {
    setLoadingAprobar(true);
    try {
      const res = await fetch(`/api/ayudante/confecciones/${confeccion.id}/aprobar`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo aprobar');
      toast.success(
        json.data?.ya_completada
          ? 'La conformidad ya estaba registrada'
          : 'Conformidad aprobada — pedido listo para despacho',
      );
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al aprobar');
    } finally {
      setLoadingAprobar(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href="/ayudante/confecciones"
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-teal-600 hover:opacity-80 mb-3"
        >
          <ArrowLeft size={13} /> Volver a confecciones
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Confección #{confeccion.id}
            </h1>
            <p className="text-sm text-stone-500 font-medium">Conformidad del taller</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        {completada && (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-800 text-xs font-black uppercase">
            <CheckCircle2 size={14} />
            Completado
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Package size={16} className="text-stone-400 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                Pedido
              </p>
              <p className="font-bold text-stone-800">
                #{confeccion.pedido?.id ?? '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User size={16} className="text-stone-400 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                Cliente
              </p>
              <p className="font-bold text-stone-800">
                {confeccion.pedido?.cliente ?? '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:col-span-2">
            <Building2 size={16} className="text-stone-400 mt-0.5 shrink-0" />
            <div className="w-full max-w-md">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
                Taller asignado
              </p>
              {completada ? (
                <p className="font-bold text-stone-800">
                  {talleres.find((t) => t.id === tallerId)?.nombre ?? '—'}
                </p>
              ) : (
                <div className="relative">
                  <select
                    value={tallerId}
                    disabled={loadingTaller || talleres.length === 0}
                    onChange={(e) => void handleTallerChange(e.target.value)}
                    className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      Seleccione un taller
                    </option>
                    {talleres.map((taller) => (
                      <option key={taller.id} value={taller.id}>
                        {taller.nombre}
                      </option>
                    ))}
                  </select>
                  {loadingTaller && (
                    <Loader2
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-600"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Package size={16} className="text-stone-400 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                Cantidad total
              </p>
              <p className="font-bold text-stone-800">{confeccion.cantidad} u.</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-stone-500">
          Estado:{' '}
          <strong>
            {ESTADO_LABELS[confeccion.estado as keyof typeof ESTADO_LABELS] ??
              confeccion.estado}
          </strong>
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 bg-stone-50">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-500">
            Prendas del pedido
          </h2>
        </div>
        {confeccion.pedidoItems.length === 0 ? (
          <p className="px-4 py-6 text-sm text-stone-500">Sin ítems en el pedido.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-stone-100">
                  <th className="px-4 py-2 text-[10px] font-black uppercase text-stone-400">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-[10px] font-black uppercase text-stone-400">
                    SKU
                  </th>
                  <th className="px-4 py-2 text-[10px] font-black uppercase text-stone-400">
                    Color / Talla
                  </th>
                  <th className="px-4 py-2 text-[10px] font-black uppercase text-stone-400 text-right">
                    Cant.
                  </th>
                </tr>
              </thead>
              <tbody>
                {confeccion.pedidoItems.map((item) => (
                  <tr key={item.id} className="border-b border-stone-50 last:border-0">
                    <td className="px-4 py-2.5 font-semibold text-stone-800">{item.nombre}</td>
                    <td className="px-4 py-2.5 text-stone-600">{item.sku ?? '—'}</td>
                    <td className="px-4 py-2.5 text-stone-600">
                      {[item.color, item.talla].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-stone-800">
                      {item.cantidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!completada && (
        <Button
          type="button"
          disabled={loadingAprobar}
          onClick={handleAprobar}
          className="w-full h-14 bg-teal-600 hover:bg-teal-700 font-black uppercase text-sm tracking-widest"
        >
          {loadingAprobar ? (
            <Loader2 size={18} className="animate-spin mr-2" />
          ) : (
            <ClipboardCheck size={18} className="mr-2" />
          )}
          Aprobar conformidad del taller
        </Button>
      )}
    </div>
  );
}
