"use client";

import React from 'react';
import {
  CheckSquare, Zap, Package, Truck,
  Clock, ChevronRight, AlertTriangle, Activity,
} from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { SparkKpiCard } from './widgets/DashboardWidgets';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';
import DashboardLoader from './DashboardLoaders';
import { GoalCard } from './GoalCard';
import type { AyudanteMetrics, DashboardKpis } from '@/lib/services/dashboard.service';

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface AyudanteData {
  kpis:     DashboardKpis;
  ayudante: AyudanteMetrics;
}

// ─── Tareas operativas (datos internos, no requieren API) ─────────────────────
const TAREAS_FIJAS = [
  { id: 1, task: 'Preparar lote para Corte',           time: '10:30 AM', urgente: true  },
  { id: 2, task: 'Recepción de telas — Proveedor',     time: '11:45 AM', urgente: false },
  { id: 3, task: 'Organizar estantería de avíos',      time: '02:00 PM', urgente: false },
];

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardAyudante() {
  const G = COMPANY_PALETTE;
  const [data, setData] = React.useState<AyudanteData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/admin/dashboard?role=ayudante')
      .then((r) => r.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLoader message="Preparando operaciones del día..." />;

  const guias             = data?.ayudante?.guias_hoy              ?? [];
  const pedidosListos     = data?.ayudante?.pedidos_listo_despacho  ?? 0;
  const incidencias       = data?.ayudante?.incidencias_abiertas    ?? 0;
  const totalTareas       = TAREAS_FIJAS.length;
  const tareasUrgentes    = TAREAS_FIJAS.filter((t) => t.urgente).length;

  return (
    <DashboardSection
      title="Centro de Operaciones"
      role="ayudante"
      subtitle="Logística interna y cumplimiento de tareas diarias"
    >
      <div className="space-y-5">

        {/* 1 ─ KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SparkKpiCard
            label="Guías Hoy"
            value={guias.length}
            delta={guias.length > 0 ? 10 : 0}
            icon={Truck}
            accentColor={G.accent}
            sparkData={[2, 3, 4, 3, 5, guias.length]}
          />
          <SparkKpiCard
            label="Listos para Despacho"
            value={pedidosListos}
            delta={pedidosListos > 0 ? 5 : 0}
            icon={CheckSquare}
            accentColor={G.accent}
            sparkData={[5, 8, 6, 10, 9, pedidosListos]}
          />
          <SparkKpiCard
            label="Incidencias Abiertas"
            value={incidencias}
            delta={incidencias > 0 ? 100 : -100}
            icon={AlertTriangle}
            accentColor={incidencias > 0 ? '#ef4444' : G.accent}
            sparkData={[0, 1, 0, 2, 1, incidencias]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* 2 ─ Hoja de ruta + actividad */}
          <div className="lg:col-span-2 space-y-5">

            {/* Tareas del día */}
            <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                    Hoja de Ruta
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">
                    Tareas pendientes para hoy
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {tareasUrgentes > 0 && (
                    <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 uppercase">
                      {tareasUrgentes} urgente{tareasUrgentes > 1 ? 's' : ''}
                    </span>
                  )}
                  <button className="text-[10px] font-black uppercase" style={{ color: G.accent }}>
                    Ver historial
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {TAREAS_FIJAS.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between p-4 rounded-2xl border border-stone-50 hover:border-rose-100 hover:bg-rose-50/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${item.urgente ? 'bg-rose-100 text-rose-600' : 'bg-stone-100 text-stone-500'}`}>
                        {item.urgente ? <Clock size={16} /> : <Package size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-800">{item.task}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase">{item.time}</p>
                      </div>
                    </div>
                    <button className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border text-rose-600">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Guías de remisión de hoy */}
            <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                    Guías del Día
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">
                    Remisiones programadas para hoy
                  </p>
                </div>
                <Activity size={16} className="text-stone-300" />
              </div>

              {guias.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Truck size={28} className="text-stone-200" />
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    Sin guías programadas hoy
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {guias.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-stone-50/50 border border-transparent hover:border-rose-100 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-50">
                          <Truck size={15} style={{ color: G.accent }} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-stone-800 uppercase">
                            {g.tipo}
                          </p>
                          <p className="text-[10px] text-stone-400 font-bold truncate w-48">
                            {g.destino}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-stone-400 uppercase">
                        #{g.numero}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3 ─ Columna derecha */}
          <div className="space-y-5">

            {/* Meta diaria */}
            <GoalCard
              label="Meta Diaria"
              pct={85}
              current={`${Math.round(totalTareas * 0.85)} tareas`}
              target={`${totalTareas} tareas`}
              color={G.accent}
            />

            {/* Próximos envíos */}
            <div className="bg-stone-900 rounded-3xl p-6 text-white overflow-hidden relative">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 bg-white/10 rounded-lg">
                    <Truck size={14} className="text-rose-300" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Próximos Envíos
                  </span>
                </div>

                {guias.length === 0 ? (
                  <p className="text-[10px] text-stone-600 uppercase font-bold text-center py-4">
                    Sin envíos pendientes
                  </p>
                ) : (
                  <div className="space-y-4">
                    {guias.slice(0, 3).map((g, i) => (
                      <div
                        key={g.id}
                        className={`border-l-2 pl-4 ${i === 0 ? 'border-rose-500/40' : 'border-white/10 opacity-60'}`}
                      >
                        <p className="text-xs font-bold text-rose-200 uppercase tracking-tighter capitalize">
                          {g.tipo}
                        </p>
                        <p className="text-sm font-black tracking-tight truncate">{g.destino}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Package size={120} className="absolute -bottom-4 -right-4 text-white/5 -rotate-12" />
            </div>

            {/* Eficiencia logística */}
            <div className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">
                Eficiencia del Día
              </h4>
              <div className="space-y-3">
                {[
                  { label: 'Tareas completadas', value: `${Math.round(totalTareas * 0.85)} / ${totalTareas}`, icon: CheckSquare, ok: true  },
                  { label: 'Guías procesadas',   value: `${guias.length}`,                                     icon: Truck,       ok: guias.length > 0 },
                  { label: 'Incidencias',         value: String(incidencias),                                   icon: AlertTriangle, ok: incidencias === 0 },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <stat.icon
                        size={13}
                        className={stat.ok ? 'text-emerald-500' : 'text-red-500'}
                      />
                      <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                        {stat.label}
                      </span>
                    </div>
                    <span className={`text-sm font-black ${stat.ok ? 'text-stone-900' : 'text-red-600'}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* KPI de eficiencia */}
            <div className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <Zap size={22} style={{ color: G.accent }} />
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  Eficiencia Logística
                </p>
                <p className="text-2xl font-black text-stone-900">98%</p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase">↑ 1% esta semana</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardSection>
  );
}