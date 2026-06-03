"use client";

import React from 'react';
import {
  Truck, Layers, AlertTriangle, CheckCircle2,
  Calendar, MapPin, ChevronRight, ArrowRightLeft, Timer,
  Warehouse,
} from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { SparkKpiCard } from './widgets/DashboardWidgets';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';
import DashboardLoader from './DashboardLoaders';
import type { RepresentanteMetrics, DashboardKpis } from '@/lib/services/dashboard.service';

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface RepresentanteData {
  kpis:           DashboardKpis;
  representante:  RepresentanteMetrics;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const estadoLote = (estado: string) => {
  switch (estado) {
    case 'Retrasado':   return { dot: 'bg-red-500',    badge: 'bg-red-500 text-white',             card: 'bg-red-50/50 border-red-100' };
    case 'En Proceso':  return { dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700',        card: 'bg-white border-stone-100' };
    default:            return { dot: 'bg-emerald-500',badge: 'bg-emerald-100 text-emerald-700',    card: 'bg-white border-stone-100' };
  }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardRepresentante() {
  const G = COMPANY_PALETTE;
  const [data, setData] = React.useState<RepresentanteData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/admin/dashboard?role=representante_taller')
      .then((r) => r.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLoader message="Cargando control de talleres..." />;

  const rep      = data?.representante;
  const lotes    = rep?.lotes_externos    ?? [];
  const ruta     = rep?.ruta_hoy          ?? [];
  const leadTime = rep?.lead_time_dias    ?? 0;

  return (
    <DashboardSection
      title="Control de Talleres"
      role="representante_taller"
      subtitle="Logística externa, control de maquila y tiempos de entrega"
    >
      <div className="space-y-5">

        {/* 1 ─ KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SparkKpiCard
            label="Lotes en Proceso"
            value={lotes.length}
            delta={3}
            icon={Truck}
            accentColor={G.accent}
            sparkData={[10, 15, 12, 14, 16, lotes.length]}
          />
          <SparkKpiCard
            label="Prendas Activas"
            value={lotes.reduce((a, b) => a + b.avance, 0)}
            delta={-5}
            icon={Layers}
            accentColor={G.accent}
            sparkData={[2800, 2600, 2500, 2450]}
          />
          <SparkKpiCard
            label="Calidad Entrega"
            value="99.2%"
            delta={1}
            icon={CheckCircle2}
            accentColor={G.accent}
            sparkData={[95, 96, 98, 97, 99]}
          />
          <SparkKpiCard
            label="Alertas Retraso"
            value={rep?.retrasados ?? 0}
            delta={rep?.retrasados ? 100 : 0}
            icon={AlertTriangle}
            accentColor="#ef4444"
            sparkData={[0, 0, 1, 0, rep?.retrasados ?? 0]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* 2 ─ Pipeline de lotes */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                    Pipeline de Producción
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">
                    Estado actual de lotes por taller externo
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 bg-stone-50 text-stone-400 rounded-xl hover:bg-stone-100 transition-colors">
                    <ArrowRightLeft size={15} />
                  </button>
                  <button
                    style={{ background: G.accent }}
                    className="px-4 py-2.5 text-white rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition-all shadow-sm"
                  >
                    Registrar Salida
                  </button>
                </div>
              </div>

              {lotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Warehouse size={36} className="text-stone-200" />
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    Sin lotes externos activos
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lotes.map((lote) => {
                    const est = estadoLote(lote.estado);
                    return (
                      <div
                        key={lote.id}
                        className={`p-4 rounded-2xl border transition-all ${est.card} hover:shadow-md`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl ${lote.estado === 'Retrasado' ? 'bg-red-100 text-red-600' : 'bg-rose-50 text-rose-600'}`}>
                              <Warehouse size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="text-sm font-black text-stone-800 uppercase">
                                  Lote #{lote.id}
                                </h4>
                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${est.badge}`}>
                                  {lote.estado}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 font-bold flex items-center gap-1 capitalize">
                                <MapPin size={11} className="text-stone-300" />
                                {lote.taller} — {lote.servicio}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Barra de progreso */}
                            <div className="w-32">
                              <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                                <span className="text-stone-400">Avance</span>
                                <span className="text-stone-700">{lote.avance}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${lote.estado === 'Retrasado' ? 'bg-red-400' : 'bg-rose-500'}`}
                                  style={{ width: `${lote.avance}%` }}
                                />
                              </div>
                            </div>

                            <div className="hidden sm:block text-right">
                              <p className="text-[9px] font-black text-stone-400 uppercase">Entrega</p>
                              <p className={`text-xs font-black ${lote.estado === 'Retrasado' ? 'text-red-600' : 'text-stone-700'}`}>
                                {lote.entrega}
                              </p>
                            </div>

                            <ChevronRight size={16} className="text-stone-300" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3 ─ Columna derecha */}
          <div className="space-y-5">

            {/* Lead time */}
            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Timer size={18} style={{ color: G.accent }} />
                </div>
                <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-widest">
                  Lead Time Promedio
                </h4>
              </div>
              <p className="text-3xl font-black text-rose-900">
                {leadTime} <span className="text-sm font-bold">días</span>
              </p>
              <p className="text-[10px] text-rose-700 font-bold uppercase mt-1">
                <span className="text-emerald-600">↓ 0.5 días</span> vs. mes pasado
              </p>
            </div>

            {/* Ruta de recojos de hoy */}
            <div className="bg-stone-900 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <Calendar size={15} className="text-rose-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">
                    Ruta de Recojos — Hoy
                  </h4>
                </div>

                {ruta.length === 0 ? (
                  <p className="text-[10px] text-stone-600 uppercase font-bold text-center py-4">
                    Sin recojos programados hoy
                  </p>
                ) : (
                  <div className="space-y-5">
                    {ruta.map((g, i) => (
                      <div key={g.id} className={`relative pl-5 border-l-2 border-dashed ${i === 0 ? 'border-rose-500/40' : 'border-stone-700'}`}>
                        <div className={`absolute -left-[7px] top-0 w-3.5 h-3.5 rounded-full border-4 border-stone-900 ${i === 0 ? 'bg-rose-500' : 'bg-stone-700'}`} />
                        <p className={`text-[10px] font-black uppercase tracking-tighter mb-0.5 ${i === 0 ? 'text-rose-400' : 'text-stone-500'}`}>
                          {g.tipo}
                        </p>
                        <p className="text-xs font-bold capitalize">{g.destino}</p>
                        <p className="text-[9px] text-stone-400 font-medium">Guía #{g.numero}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Truck className="absolute -bottom-8 -right-8 text-white/5 -rotate-12" size={150} />
            </div>

            {/* Resumen retrasados */}
            {(rep?.retrasados ?? 0) > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-3xl p-5">
                <div className="flex items-center gap-2.5 mb-1">
                  <AlertTriangle size={16} className="text-red-500" />
                  <h4 className="text-[10px] font-black text-red-900 uppercase tracking-widest">
                    Lotes Retrasados
                  </h4>
                </div>
                <p className="text-3xl font-black text-red-600">{rep!.retrasados}</p>
                <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                  Requieren atención inmediata
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardSection>
  );
}