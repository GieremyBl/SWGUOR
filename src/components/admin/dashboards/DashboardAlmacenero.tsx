"use client";

import React from 'react';
import {
  Box, AlertTriangle, TrendingUp, ArrowDownLeft,
  ArrowUpRight, Package, ClipboardList, Plus,
  Search, Filter, History,
} from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { SparkKpiCard, StockCriticoList } from './widgets/DashboardWidgets';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';
import DashboardLoader from './DashboardLoaders';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Movimiento {
  id: number;
  item: string;
  type: 'entrada' | 'salida';
  qty: string;
  user: string;
  date: string;
}
interface StockItem {
  id: number;
  nombre: string;
  stock: number;
  stock_actual: number;
  minimo: number;
  tipo: string;
  unidad_medida?: string;
}
interface AlmacenData {
  kpis: {
    totalInsumos: number;
    stockAlerta: number;
    movimientosHoy: number;
    ordenesPendientes: number;
  };
  criticalStock: StockItem[];
  movimientos: Movimiento[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardAlmacenero() {
  const G = COMPANY_PALETTE;
  const [data, setData] = React.useState<AlmacenData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState('');

  React.useEffect(() => {
    fetch('/api/admin/dashboard?role=almacenero')
      .then((r) => r.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLoader message="Sincronizando inventario..." />;

  const movimientos = (data?.movimientos ?? []).filter((m) =>
    busqueda === '' || m.item.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <DashboardSection
      title="Centro de Almacén"
      role="almacenero"
      subtitle="Control de existencias, movimientos y reposición de materiales"
    >
      <div className="space-y-5">

        {/* 1 ─ KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SparkKpiCard
            label="Insumos Totales"
            value={data?.kpis?.totalInsumos ?? 0}
            delta={2}
            icon={Box}
            accentColor={G.accent}
            sparkData={[1200, 1210, 1205, 1220, 1230, data?.kpis?.totalInsumos ?? 0]}
          />
          <SparkKpiCard
            label="Alertas de Stock"
            value={data?.kpis?.stockAlerta ?? 0}
            delta={-1}
            icon={AlertTriangle}
            accentColor="#ef4444"
            sparkData={[12, 10, 11, 9, 8, data?.kpis?.stockAlerta ?? 0]}
          />
          <SparkKpiCard
            label="Movimientos Hoy"
            value={data?.kpis?.movimientosHoy ?? 0}
            delta={15}
            icon={TrendingUp}
            accentColor={G.accent}
            sparkData={[20, 35, 25, 40, 38, data?.kpis?.movimientosHoy ?? 0]}
          />
          <SparkKpiCard
            label="Órdenes Compra"
            value={data?.kpis?.ordenesPendientes ?? 0}
            delta={4}
            icon={Package}
            accentColor={G.accent}
            sparkData={[20, 22, 21, 23, 24, data?.kpis?.ordenesPendientes ?? 0]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Stock crítico */}
          <div className="lg:col-span-1">
            <StockCriticoList data={data?.criticalStock ?? []} />
          </div>

          {/* Movimientos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                    Últimos Movimientos
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">
                    Entradas y salidas en tiempo real
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar..."
                      className="pl-8 pr-3 py-2 bg-stone-50 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-rose-400 w-32"
                    />
                  </div>
                  <button
                    style={{ background: G.accent }}
                    className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition-all"
                  >
                    <Plus size={13} /> Registrar
                  </button>
                </div>
              </div>

              {movimientos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Package size={32} className="text-stone-200" />
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    {busqueda ? 'Sin resultados' : 'Sin movimientos registrados hoy'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {movimientos.map((m) => (
                    <div
                      key={m.id}
                      className="group flex items-center justify-between p-4 rounded-2xl bg-stone-50/50 border border-transparent hover:border-rose-100 hover:bg-white hover:shadow-lg hover:shadow-rose-50/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${m.type === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {m.type === 'entrada' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-stone-900">{m.item}</p>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                            {m.user}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-black ${m.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.qty}
                        </p>
                        <p className="text-[9px] font-black text-stone-300 uppercase">
                          {new Date(m.date).toLocaleDateString('es-PE')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button className="w-full mt-4 py-3.5 border-2 border-dashed border-stone-100 rounded-2xl text-[10px] font-black text-stone-400 uppercase hover:border-rose-200 hover:text-rose-500 transition-all flex items-center justify-center gap-2">
                <History size={13} /> Ver historial completo
              </button>
            </div>

            {/* Accesos rápidos */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className="p-5 rounded-3xl text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${G.accent} 0%, ${G.secondary} 100%)` }}
              >
                <ClipboardList className="mb-4 opacity-70" size={28} />
                <h4 className="text-base font-black leading-tight mb-1">Toma de<br />Inventario</h4>
                <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest opacity-80">
                  Iniciar Auditoría
                </p>
              </div>
              <div className="bg-white border border-stone-100 p-5 rounded-3xl text-stone-900 shadow-sm flex flex-col justify-between">
                <Filter className="text-stone-200 mb-4" size={28} />
                <div>
                  <h4 className="text-base font-black leading-tight mb-1">Reporte de<br />Faltantes</h4>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Generar PDF
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardSection>
  );
}