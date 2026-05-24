"use client";

import React from 'react';
import {
  Box, AlertTriangle, TrendingUp, ArrowDownLeft,
  ArrowUpRight, Package, ClipboardList, Plus,
  Search, Filter, History
} from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { SparkKpiCard, StockCriticoList } from './widgets/DashboardWidgets';
import { ROLE_PALETTES } from "./widgets/DashboardUtils";

export default function DashboardAlmacenero() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/admin/dashboard?days=30&role=almacenero')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const movimientosRecientes = data?.almacen?.movimientos || [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Package className="animate-bounce text-sky-600" size={32} />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Sincronizando inventario...</p>
      </div>
    );
  }

  return (
    <DashboardSection
      title="Centro de Almacén"
      role="administrador"
      subtitle="Control de existencias, movimientos y reposición de materiales"
    >
      <div className="space-y-6">

        {/* 1. KPIs de Almacén */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SparkKpiCard
            label="Insumos Totales" value={data?.kpis?.total_insumos ?? "0"} delta={2}
            icon={Box} accentColor="#0284c7" sparkData={[1200, 1210, 1205, 1220, 1230, 1240]}
          />
          <SparkKpiCard
            label="Alertas de Stock" value={data?.kpis?.stock_alerta ?? "0"} delta={-1}
            icon={AlertTriangle} accentColor="#e11d48" sparkData={[12, 10, 11, 9, 8, 8]}
          />
          <SparkKpiCard
            label="Movimientos Hoy" value={movimientosRecientes.length} delta={15}
            icon={TrendingUp} accentColor="#059669" sparkData={[20, 35, 25, 40, 38, 42]}
          />
          <SparkKpiCard
            label="Órdenes Compra" value={data?.almacen?.ordenes_pendientes ?? "0"} delta={4}
            icon={Package} accentColor="#7c3aed" sparkData={[20, 22, 21, 23, 24, 24]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* 2. Listado de Stock Crítico */}
          <div className="lg:col-span-1">
            <StockCriticoList data={data?.criticalStock ?? []} />
          </div>

          {/* 3. Movimientos Recientes */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Últimos Movimientos</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Entradas y salidas de materiales en tiempo real</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
                    <Search size={16} />
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all active:scale-95">
                    <Plus size={14} /> Registrar
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {movimientosRecientes.map((m: any) => (
                  <div key={m.id} className="group flex items-center justify-between p-5 rounded-[2rem] bg-slate-50/50 border border-transparent hover:border-sky-100 hover:bg-white hover:shadow-xl hover:shadow-sky-50/50 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${m.type === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {m.type === 'entrada' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{m.item}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsable: {m.user}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${m.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>{m.qty}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase">{new Date(m.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 rounded-3xl text-[10px] font-black text-slate-400 uppercase hover:border-sky-200 hover:text-sky-600 transition-all flex items-center justify-center gap-2">
                <History size={14} /> Ver historial completo
              </button>
            </div>

            {/* Accesos Rápidos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-sky-600 to-sky-700 p-6 rounded-[2.5rem] text-white shadow-lg shadow-sky-100">
                <ClipboardList className="text-sky-200 mb-4" size={32} />
                <h4 className="text-lg font-black leading-tight mb-1">Toma de<br />Inventario</h4>
                <p className="text-[10px] font-bold text-sky-100 uppercase tracking-widest opacity-80">Iniciar Auditoría</p>
              </div>
              <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] text-slate-900 shadow-sm flex flex-col justify-between">
                <Filter className="text-slate-200 mb-4" size={32} />
                <div>
                  <h4 className="text-lg font-black leading-tight mb-1">Reporte de<br />Faltantes</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generar PDF</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardSection>
  );
}
