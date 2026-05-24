'use client';

import { Truck, AlertCircle, RefreshCw } from 'lucide-react';
import CardDespacho from '@/components/portal/despachos/CardDespacho';
import { useDespachos } from '@/lib/hooks/useDespachos';

export default function DespachosPage() {
  const { despachos, cargando, error, refetch } = useDespachos();

  return (
    <div className="space-y-10 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#d4af37] font-semibold text-xs uppercase tracking-[0.2em]">
            <div className="w-8 h-px bg-[#d4af37]/40" />
            <span>Logística & Despacho</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Gestión de <span className="text-[#d4af37]">Envíos</span>
          </h1>
          <p className="text-slate-500 max-w-xl text-sm leading-relaxed">
            Rastree la ubicación de su mercancía y el tiempo estimado de entrega de sus lotes activos.
          </p>
        </div>

        {!cargando && !error && (
          <div className="flex items-center gap-4 bg-white p-2 pl-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col text-right pr-2 border-r border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Activos</span>
              <span className="text-base font-bold text-slate-900">{despachos.length}</span>
            </div>
            <button
              onClick={refetch}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all hover:rotate-180 duration-500"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="grid grid-cols-1 gap-8">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-medium text-sm">Sincronizando logística...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 flex flex-col items-center text-center gap-4 text-rose-600">
            <AlertCircle size={28} />
            <p className="font-bold text-sm">Error al cargar logística</p>
            <p className="text-xs opacity-80">{error}</p>
            <button onClick={refetch} className="mt-2 text-xs font-bold uppercase underline">Reintentar</button>
          </div>
        ) : despachos.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 flex flex-col items-center text-center gap-6 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Truck size={36} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Sin envíos en ruta</h3>
              <p className="text-slate-500 max-w-sm text-xs">
                No tiene despachos activos en este momento. Los pedidos aparecerán aquí una vez salgan de producción.
              </p>
            </div>
          </div>
        ) : (
          despachos.map((d) => (
            <CardDespacho key={d.id} despacho={d} />
          ))
        )}
      </div>
    </div>
  );
}