"use client";

/**
 * DashboardCortador.tsx — v2
 * Mejoras vs v1:
 *  - Paleta rose corporativa (elimina blue-600, amber, green ad hoc)
 *  - Tipos reales: CortadorMetrics / DashboardKpis (sin `any`)
 *  - StockCriticoList conectado a criticalStock real (no data={[]})
 *  - GoalCard reutilizable en lugar de gradiente blue hardcodeado
 *  - DashboardLoader unificado
 *  - Border-radius estandarizado: rounded-3xl / rounded-2xl / rounded-xl
 *  - Empty state en cola de trabajo
 *  - Resumen del turno con conteos reales
 */

import React from 'react';
import {
  Scissors, Layers, CheckCircle2, Play,
  Plus, Filter, Clock, AlertTriangle,
  Zap, Activity, History, AlertCircle,
} from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { SparkKpiCard, StockCriticoList } from './widgets/DashboardWidgets';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';
import DashboardLoader from './DashboardLoaders';
import { GoalCard } from './GoalCard';
import { cn } from '@/lib/utils';
import type {
  CortadorMetrics,
  CriticalStockItem,
  DashboardKpis,
} from '@/lib/services/dashboard.service';

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface CortadorData {
  kpis:          DashboardKpis;
  corte:         CortadorMetrics;
  criticalStock: CriticalStockItem[];
}

// ─── Estilos por estado de orden ──────────────────────────────────────────────
const estadoOrden: Record<string, { icon: string; badge: string }> = {
  confirmada:    { icon: 'bg-rose-600 text-white shadow-sm shadow-rose-200',   badge: 'bg-rose-50 text-rose-700 border-rose-200'   },
  en_produccion: { icon: 'bg-amber-500 text-white shadow-sm shadow-amber-200', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  borrador:      { icon: 'bg-stone-100 text-stone-400',                        badge: 'bg-stone-50 text-stone-500 border-stone-200' },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardCortador() {
  const G = COMPANY_PALETTE;
  const [data, setData] = React.useState<CortadorData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/admin/dashboard?role=cortador')
      .then((r) => r.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLoader message="Afilando herramientas..." />;

  const cola        = data?.corte?.cola_trabajo ?? [];
  const habilitados = cola.filter((o) => o.estado === 'en_produccion').length;
  const pctMeta     = cola.length > 0 ? Math.round((habilitados / cola.length) * 100) : 0;

  return (
    <DashboardSection
      title="Sala de Corte"
      role="cortador"
      subtitle="Programación de tendido, tizado y corte industrial"
    >
      <div className="space-y-5">

        {/* 1 ─ KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SparkKpiCard
            label="Órdenes en Cola"
            value={cola.length}
            delta={5}
            icon={Scissors}
            accentColor={G.accent}
            sparkData={[10, 15, 12, 18, 14, cola.length]}
          />
          <SparkKpiCard
            label="Telas en Alerta"
            value={data?.kpis?.stock_alerta ?? 0}
            delta={-2}
            icon={AlertTriangle}
            accentColor="#ef4444"
            sparkData={[5, 4, 6, 3, 2, data?.kpis?.stock_alerta ?? 0]}
          />
          <SparkKpiCard
            label="Productividad"
            value="94%"
            delta={1}
            icon={Zap}
            accentColor={G.accent}
            sparkData={[88, 90, 89, 92, 93, 94]}
          />
          <SparkKpiCard
            label="Metros Cortados"
            value="1.2k"
            delta={12}
            icon={Activity}
            accentColor={G.accent}
            sparkData={[800, 950, 1100, 1050, 1200, 1250]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* 2 ─ Cola de trabajo */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                    Cola de Trabajo
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">
                    Órdenes asignadas para habilitación inmediata
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 bg-stone-50 text-stone-400 rounded-xl hover:bg-stone-100 transition-colors">
                    <Filter size={15} />
                  </button>
                  <button
                    style={{ background: G.accent }}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition-all shadow-sm"
                  >
                    <Plus size={13} /> Nuevo Lote
                  </button>
                </div>
              </div>

              {cola.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Scissors size={36} className="text-stone-200" />
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    Cola vacía — sin órdenes pendientes
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cola.map((orden) => {
                    const est = estadoOrden[orden.estado] ?? estadoOrden.borrador;
                    return (
                      <div
                        key={orden.id}
                        className="group flex items-center justify-between p-4 rounded-2xl bg-stone-50/50 border border-transparent hover:border-rose-100 hover:bg-white hover:shadow-lg hover:shadow-rose-50/30 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          {/* Icono de estado */}
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105',
                            est.icon,
                          )}>
                            {orden.estado === 'en_produccion'
                              ? <Play size={20} className="fill-current" />
                              : <Layers size={20} />
                            }
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-black text-stone-900 uppercase tracking-tight">
                                Orden #{orden.id}
                              </p>
                              {orden.prioridad === 'alta' && (
                                <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase animate-pulse">
                                  Urgente
                                </span>
                              )}
                              {/* Badge de estado */}
                              <span className={cn(
                                'text-[9px] px-2 py-0.5 rounded-full font-black uppercase border',
                                est.badge,
                              )}>
                                {orden.estado.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 font-bold uppercase tracking-tighter">
                              {orden.prenda}
                              {' • '}
                              <span style={{ color: G.accent }}>{orden.lotes} prendas</span>
                              {orden.taller !== '—' && (
                                <> • <span className="text-stone-400">{orden.taller}</span></>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-0.5">
                              Entrega
                            </p>
                            <div className="flex items-center gap-1 justify-end">
                              <Clock size={11} className="text-stone-400" />
                              <p className="text-xs font-black text-stone-700">{orden.deadline}</p>
                            </div>
                          </div>
                          <button className="p-2.5 rounded-xl bg-white border border-stone-100 text-stone-400 hover:text-rose-600 hover:border-rose-200 transition-all">
                            <History size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Estado de maquinaria */}
            <div className="bg-stone-900 rounded-3xl p-6 text-white overflow-hidden relative">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                    Estado de Maquinaria
                  </h4>
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg uppercase">
                    Óptimo
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Afilado Cuchillas',  pct: 85, color: 'from-emerald-600 to-emerald-400' },
                    { label: 'Lubricación Cabezal', pct: 92, color: 'from-rose-600 to-rose-400'       },
                  ].map((m) => (
                    <div key={m.label} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        <span>{m.label}</span>
                        <span className="text-white">{m.pct}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${m.color} h-full rounded-full`}
                          style={{ width: `${m.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-2.5 pt-3 border-t border-white/5 text-stone-500">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Próxima Revisión:{' '}
                      <span className="text-white">15 May</span>
                    </span>
                  </div>
                </div>
              </div>
              <Scissors className="absolute -bottom-8 -right-8 text-white/5 rotate-12" size={140} />
            </div>
          </div>

          {/* 3 ─ Columna derecha */}
          <div className="space-y-5">

            {/* Meta de producción — GoalCard reutilizable */}
            <GoalCard
              label="Lotes Habilitados Hoy"
              pct={pctMeta}
              current={String(habilitados)}
              target={`${cola.length} lotes`}
              color={G.accent}
            />

            {/* Stock crítico de telas — datos reales */}
            <div className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">
                Stock Crítico — Telas
              </h4>
              <StockCriticoList data={data?.criticalStock ?? []} />
            </div>

            {/* Resumen del turno */}
            <div className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">
                Resumen del Turno
              </h4>
              <div className="space-y-3">
                {[
                  {
                    label: 'En producción',
                    value: cola.filter((o) => o.estado === 'en_produccion').length,
                    icon:  CheckCircle2,
                    color: 'text-emerald-500',
                  },
                  {
                    label: 'Confirmadas',
                    value: cola.filter((o) => o.estado === 'confirmada').length,
                    icon:  Layers,
                    color: 'text-rose-500',
                  },
                  {
                    label: 'Sin fecha',
                    value: cola.filter((o) => o.deadline === 'Sin fecha').length,
                    icon:  Clock,
                    color: 'text-amber-500',
                  },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <stat.icon size={13} className={stat.color} />
                      <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                        {stat.label}
                      </span>
                    </div>
                    <span className="text-sm font-black text-stone-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardSection>
  );
}