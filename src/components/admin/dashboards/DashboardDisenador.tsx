"use client";

/**
 * DashboardDisenador.tsx — v2
 * Mejoras:
 *  - Tipos reales de DisenadorMetrics / DashboardKpis (sin `any`)
 *  - RankingProductos conectado a topProductos real
 *  - Paleta rose corporativa (sin fuchsia ad hoc)
 *  - Empty state en galería de fichas
 *  - Border-radius estandarizado
 *  - DashboardLoader unificado
 */

import React from 'react';
import {
  Shirt, Sparkles, Scissors, FileText,
  Palette, Plus, ChevronRight, Eye, Clock, CheckCircle2,
} from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { SparkKpiCard, RankingProductos } from './widgets/DashboardWidgets';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';
import DashboardLoader from './DashboardLoaders';
import { cn } from '@/lib/utils';
import type {
  DisenadorMetrics,
  TopProducto,
  DashboardKpis,
} from '@/lib/services/dashboard.service';

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface DisenadorData {
  kpis:         DashboardKpis;
  diseno:       DisenadorMetrics;
  topProductos: TopProducto[];
}

// ─── Badge de estado de ficha ─────────────────────────────────────────────────
const fichaBadge: Record<string, string> = {
  aprobada:   'text-emerald-600',
  borrador:   'text-stone-400',
  revision:   'text-amber-500',
  rechazada:  'text-red-500',
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardDisenador() {
  const G = COMPANY_PALETTE;
  const [data, setData] = React.useState<DisenadorData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/admin/dashboard?role=disenador')
      .then((r) => r.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLoader message="Cargando estudio de diseño..." />;

  const fichas       = data?.diseno?.fichas_recientes ?? [];
  const aprobadas    = fichas.filter((f) => f.estado === 'aprobada').length;
  const topProductos = data?.topProductos ?? [];

  return (
    <DashboardSection
      title="Estudio de Diseño"
      role="disenador"
      subtitle="Gestión de conceptos, moldaje y especificaciones técnicas"
    >
      <div className="space-y-5">

        {/* 1 ─ KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SparkKpiCard
            label="Nuevos Diseños"
            value={data?.diseno?.total_diseños ?? 0}
            delta={15}
            icon={Shirt}
            accentColor={G.accent}
            sparkData={[5, 12, 8, 15, 20, data?.diseno?.total_diseños ?? 0]}
          />
          <SparkKpiCard
            label="Fichas Técnicas"
            value={data?.kpis?.total_insumos ?? 0}
            delta={5}
            icon={FileText}
            accentColor={G.accent}
            sparkData={[70, 75, 80, 82, 85, 89]}
          />
          <SparkKpiCard
            label="Aprobadas"
            value={aprobadas}
            delta={3}
            icon={CheckCircle2}
            accentColor={G.accent}
            sparkData={[3, 4, 5, 6, 7, aprobadas]}
          />
          <SparkKpiCard
            label="Eficiencia Muestreo"
            value="92%"
            delta={3}
            icon={Sparkles}
            accentColor={G.accent}
            sparkData={[80, 85, 82, 88, 90, 92]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* 2 ─ Galería de fichas (columna principal) */}
          <div className="lg:col-span-2 space-y-5">

            {/* Mesa de dibujo */}
            <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                    Mesa de Dibujo
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">
                    Últimas fichas técnicas en el sistema
                  </p>
                </div>
                <button
                  style={{ background: G.accent }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition-all active:scale-95 shadow-sm"
                >
                  <Plus size={13} /> Nueva Ficha
                </button>
              </div>

              {fichas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Palette size={36} className="text-stone-200" />
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    Sin fichas técnicas registradas
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {fichas.map((item) => (
                    <div key={item.id} className="group relative">
                      {/* Tarjeta de ficha */}
                      <div className="aspect-[3/4] bg-rose-50/40 rounded-2xl border-2 border-dashed border-rose-100 flex flex-col items-center justify-center gap-2 hover:bg-rose-100/40 transition-all cursor-pointer overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-stone-900/20 backdrop-blur-[3px] transition-all duration-200">
                          <div className="bg-white p-3.5 rounded-full shadow-xl scale-75 group-hover:scale-100 transition-transform">
                            <Eye size={20} style={{ color: G.accent }} />
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm text-stone-300 group-hover:text-rose-400 transition-colors">
                          <Palette size={22} />
                        </div>
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                          Previsualizar
                        </span>
                      </div>
                      {/* Info */}
                      <div className="mt-3 px-1">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className="text-[11px] font-black text-stone-900 truncate w-28">
                            {item.prenda}
                          </p>
                          <span className="text-[8px] font-black bg-stone-900 text-white px-1.5 py-0.5 rounded-md">
                            v{item.version ?? '1'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={cn(
                            'text-[9px] font-black uppercase tracking-tighter',
                            fichaBadge[item.estado ?? 'borrador'] ?? 'text-stone-400',
                          )}>
                            {item.estado ?? 'borrador'}
                          </span>
                          <div className="flex items-center gap-1 text-[9px] text-stone-400 font-bold">
                            <Clock size={9} />
                            {new Date(item.fecha).toLocaleDateString('es-PE')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Escalados pendientes */}
            <div className="bg-stone-900 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.18em] mb-5">
                  Próximos Escalados — Patronaje
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fichas
                    .filter((f) => f.estado !== 'aprobada')
                    .slice(0, 4)
                    .map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-500/20 rounded-xl">
                            <Scissors size={15} className="text-rose-400" />
                          </div>
                          <span className="text-[11px] font-black tracking-tight truncate w-28">
                            {f.prenda}
                          </span>
                        </div>
                        <ChevronRight size={15} className="text-white/20 group-hover:text-white transition-colors" />
                      </div>
                    ))}
                  {fichas.filter((f) => f.estado !== 'aprobada').length === 0 && (
                    <p className="text-[10px] text-stone-600 uppercase font-bold col-span-2 text-center py-4">
                      Todos los diseños aprobados
                    </p>
                  )}
                </div>
              </div>
              <Sparkles className="absolute -bottom-8 -right-8 text-white/5" size={140} />
            </div>
          </div>

          {/* 3 ─ Columna derecha */}
          <div className="space-y-5">

            {/* Ranking productos reales */}
            <RankingProductos data={topProductos} accentColor={G.accent} />

            {/* Progreso de colección */}
            <div
              className="rounded-3xl p-6 text-white relative shadow-sm overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}
            >
              <div className="relative z-10">
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-6">
                  Temporada Actual
                </h4>
                <div className="space-y-5">
                  {[
                    { label: 'Diseños Aprobados', value: aprobadas,    total: fichas.length, color: 'bg-rose-500' },
                    { label: 'Fichas Completas',  value: aprobadas,    total: fichas.length, color: 'bg-emerald-400' },
                  ].map((item) => {
                    const pct = item.total > 0
                      ? Math.round((item.value / item.total) * 100)
                      : 0;
                    return (
                      <div key={item.label} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-stone-400">{item.label}</span>
                          <span className="text-white">{item.value} / {item.total}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2.5 rounded-xl">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-bold text-stone-300 leading-tight">
                    Ritmo operativo:{' '}
                    <span className="text-white font-black">12% superior</span> al promedio.
                  </p>
                </div>
              </div>
              <Shirt className="absolute -bottom-10 -right-10 text-white/5 rotate-12" size={180} />
            </div>

            {/* Tags de materiales */}
            <div className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">
                Materiales en Tendencia
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Seda Italiana', 'Botón Nácar', 'Jersey 30/1', 'Rib 2x1', 'Denim 12oz'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-[9px] font-black uppercase hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardSection>
  );
}