'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  Play,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ESTADO_LABELS } from '@/lib/schemas/confecciones';

export interface TallerOption {
  id: string;
  nombre: string;
  especialidad: string | null;
  contacto: string;
  telefono: string;
}

export interface SeguimientoConfeccionItem {
  id: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  notas: string | null;
  created_at: string;
}

export interface OrdenRepresentanteData {
  id: string;
  estado: string;
  cantidad_solicitada: number;
  notas: string | null;
  producto: { id: string; nombre: string; sku: string | null };
  taller: { id: string; nombre: string; especialidad: string | null };
  ficha: {
    id: string;
    version: string | null;
    ficha_url: string | null;
    imagen_geometral: string | null;
    estado: string | null;
  } | null;
  pedido: {
    id: string;
    cliente: string;
  } | null;
  confeccion: {
    id: string;
    estado: string;
    prenda: string;
    cantidad: number;
    notas: string | null;
    seguimiento: SeguimientoConfeccionItem[];
  } | null;
}

interface Props {
  orden: OrdenRepresentanteData;
  talleresActivos: TallerOption[];
}

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'bg-slate-100 text-slate-700',
  en_proceso: 'bg-blue-100 text-blue-700',
  completada: 'bg-emerald-100 text-emerald-700',
};

const SIGUIENTE: Record<string, { estado: string; label: string; icon: typeof Play }> = {
  pendiente: { estado: 'en_proceso', label: 'Iniciar confección', icon: Play },
  en_proceso: { estado: 'completada', label: 'Marcar completada', icon: CheckCircle2 },
};

export function RepresentanteOrdenWorkspace({ orden, talleresActivos }: Props) {
  const router = useRouter();
  const [tallerSeleccionado, setTallerSeleccionado] = useState(orden.taller.id);
  const [loadingTaller, setLoadingTaller] = useState(false);
  const [loadingEstado, setLoadingEstado] = useState(false);

  const conf = orden.confeccion;
  const siguiente = conf ? SIGUIENTE[conf.estado] : null;

  const reasignarTaller = async () => {
    if (tallerSeleccionado === orden.taller.id) {
      toast.info('El taller seleccionado es el mismo asignado');
      return;
    }
    setLoadingTaller(true);
    try {
      const res = await fetch(`/api/representante/ordenes/${orden.id}/taller`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taller_id: tallerSeleccionado }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al reasignar');
      toast.success(`Taller actualizado: ${json.data?.taller ?? 'OK'}`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al reasignar taller');
    } finally {
      setLoadingTaller(false);
    }
  };

  const avanzarEstado = async (nuevoEstado: string) => {
    setLoadingEstado(true);
    try {
      const res = await fetch(`/api/representante/ordenes/${orden.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al actualizar estado');
      toast.success('Estado actualizado');
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar estado');
    } finally {
      setLoadingEstado(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href="/admin/Panel-Administrativo/ordenes-produccion"
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-lime-700 hover:opacity-80 mb-3"
        >
          <ArrowLeft size={13} /> Volver a órdenes
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-lime-600 text-white shadow-sm">
            <Scissors size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Orden #{orden.id}
            </h1>
            <p className="text-sm text-stone-500 font-medium">{orden.producto.nombre}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          Confección asignada
        </h2>
        {!conf ? (
          <p className="text-sm text-stone-500">Sin registro de confección.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-bold text-stone-900">{conf.prenda}</span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${ESTADO_BADGE[conf.estado] ?? 'bg-stone-100'}`}
              >
                {ESTADO_LABELS[conf.estado as keyof typeof ESTADO_LABELS] ?? conf.estado}
              </span>
            </div>
            <p className="text-sm text-stone-600">
              Cantidad: <strong>{conf.cantidad}</strong> · Taller:{' '}
              <strong>{orden.taller.nombre}</strong>
            </p>
            {orden.pedido && (
              <p className="text-xs text-stone-500">
                Pedido #{orden.pedido.id} — {orden.pedido.cliente}
              </p>
            )}
          </>
        )}
      </div>

      {conf && siguiente && (
        <div className="rounded-xl border border-lime-200 bg-lime-50/50 p-5">
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">
            Avanzar estado
          </h2>
          <Button
            type="button"
            disabled={loadingEstado}
            onClick={() => avanzarEstado(siguiente.estado)}
            className="bg-lime-600 hover:bg-lime-700 font-black uppercase text-xs tracking-widest"
          >
            {loadingEstado ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <siguiente.icon size={16} className="mr-2" />
            )}
            {siguiente.label}
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
          <Building2 size={12} /> Reasignar taller
        </h2>
        <select
          value={tallerSeleccionado}
          onChange={(e) => setTallerSeleccionado(e.target.value)}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          {talleresActivos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
              {t.especialidad ? ` (${t.especialidad})` : ''}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          disabled={loadingTaller}
          onClick={reasignarTaller}
          className="font-black uppercase text-xs tracking-widest"
        >
          {loadingTaller && <Loader2 size={14} className="animate-spin mr-2" />}
          Cambiar taller
        </Button>
      </div>

      {conf && conf.seguimiento.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">
            Historial
          </h2>
          <ul className="space-y-2 text-sm">
            {conf.seguimiento.map((s) => (
              <li key={s.id} className="border-l-2 border-lime-300 pl-3 py-1">
                <span className="font-bold text-stone-700">
                  {s.estado_anterior ? `${s.estado_anterior} → ` : ''}
                  {s.estado_nuevo ?? '—'}
                </span>
                {s.notas && <p className="text-xs text-stone-500">{s.notas}</p>}
                <p className="text-[10px] text-stone-400">
                  {new Date(s.created_at).toLocaleString('es-PE')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
