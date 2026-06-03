"use client";

/**
 * DashboardGerente.tsx  — v2
 * Mejoras:
 *  - Paleta 100% rose corporativa (sin violeta ad hoc)
 *  - Gráfico de ventas sin duplicado
 *  - GoalCard reutilizable
 *  - Tipos reales del service (sin `any`)
 *  - Loading state unificado con DashboardLoader
 *  - Border-radius estandarizado: rounded-3xl / rounded-2xl / rounded-xl
 */

import React from 'react';
import {
  TrendingUp, DollarSign, Users, Activity,
  ArrowUpRight, Briefcase, Target, Award,
} from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { SparkKpiCard, VentasMensualesChart, RankingProductos } from './widgets/DashboardWidgets';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';
import DashboardLoader from './DashboardLoaders';
import GoalCard from './GoalCard';

// ─── Tipos inferidos del service ─────────────────────────────────────────────
interface TopCliente {
  razon_social: string;
  total: number;
}
// ProductoData: { nombre, cantidad } — alineado con DashboardWidgets
interface RankingItem {
  nombre:   string;
  cantidad: number;
}
// VentasData: { mes, ventas } — alineado con DashboardWidgets
interface VentaMensual {
  mes:    string;
  ventas: number;
}
interface GerenteData {
  kpis: {
    facturacion: number;
    pedidosActivos: number;
    cotizacionesPend: number;
    clientesB2B: number;
  };
  ventasMensuales: VentaMensual[];
  rankingProductos: RankingItem[];
  topClientes: TopCliente[];
  sparklines: {
    facturacion: number[];
    pedidos: number[];
    cotizaciones: number[];
    clientes: number[];
  };
}

// ─── Componente de balance rápido ─────────────────────────────────────────────
const BalanceItem = ({
  icon: Icon,
  label,
  value,
  bg,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  bg: string;
  color: string;
}) => (
  <div className="bg-white border border-stone-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-xl ${bg}`}>
      <Icon size={18} className={color} />
    </div>
    <div>
      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{label}</p>
      <p className="text-base font-black text-stone-900 leading-tight">{value}</p>
    </div>
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function GerenteDashboard() {
  const G = COMPANY_PALETTE;
  const [data, setData] = React.useState<GerenteData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/admin/dashboard?role=gerente')
      .then((r) => r.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLoader message="Calculando métricas estratégicas..." />;

  const k = data?.kpis;
  const meta = 55000;
  const pct = Math.min(100, Math.round(((k?.facturacion ?? 0) / meta) * 100));

  return (
    <DashboardSection
      title="Panel de Gerencia"
      role="gerente"
      subtitle="Visibilidad estratégica, rentabilidad y salud financiera"
    >
      <div className="space-y-6">

        {/* 1 ─ KPIs superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SparkKpiCard
            label="Facturación 30d"
            value={`S/ ${Number(k?.facturacion ?? 0).toLocaleString('es-PE')}`}
            delta={12}
            icon={DollarSign}
            accentColor={G.accent}
            sparkData={data?.sparklines?.facturacion ?? []}
          />
          <SparkKpiCard
            label="Clientes Activos"
            value={k?.clientesB2B ?? 0}
            delta={5}
            icon={Users}
            accentColor={G.accent}
            sparkData={data?.sparklines?.clientes ?? []}
          />
          <SparkKpiCard
            label="Pedidos Activos"
            value={k?.pedidosActivos ?? 0}
            delta={2}
            icon={Activity}
            accentColor={G.accent}
            sparkData={data?.sparklines?.pedidos ?? []}
          />
          <SparkKpiCard
            label="Cotiz. Pendientes"
            value={k?.cotizacionesPend ?? 0}
            delta={4}
            icon={TrendingUp}
            accentColor={G.accent}
            sparkData={data?.sparklines?.cotizaciones ?? []}
          />
        </div>

        {/* 2 ─ Gráfico principal + columna lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Gráfico único de ventas mensuales */}
          <div className="lg:col-span-3 bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                  Ventas Mensuales
                </h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">
                  Ingresos verificados últimos 6 meses
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-rose-600">
                <div className="w-2 h-2 rounded-full bg-rose-600" /> Ingresos
              </div>
            </div>
            <VentasMensualesChart
              data={data?.ventasMensuales ?? []}
              accentColor={G.accent}
            />
          </div>

          {/* Columna lateral: balance + meta */}
          <div className="flex flex-col gap-4">
            <BalanceItem icon={Award}    label="Facturación"  value={`S/ ${Number(k?.facturacion ?? 0).toLocaleString('es-PE')}`} bg="bg-emerald-50" color="text-emerald-600" />
            <BalanceItem icon={Briefcase} label="Pedidos"     value={`${k?.pedidosActivos ?? 0} activos`} bg="bg-amber-50" color="text-amber-600" />
            <BalanceItem icon={Target}   label="Cotizaciones" value={`${k?.cotizacionesPend ?? 0} pendientes`} bg="bg-rose-50" color="text-rose-600" />

            <GoalCard
              label="Meta Mensual"
              pct={pct}
              current={`S/ ${Math.round((k?.facturacion ?? 0) / 1000)}k`}
              target="S/ 55k"
              color={G.accent}
            />
          </div>
        </div>

        {/* 3 ─ Ranking productos + Top clientes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div className="lg:col-span-2">
            <RankingProductos data={data?.rankingProductos ?? []} accentColor={G.accent} />
          </div>

          {/* Top clientes */}
          <div className="bg-stone-900 rounded-3xl p-6 text-white">
            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-5">
              Top Clientes
            </h4>
            <div className="space-y-4">
              {(data?.topClientes ?? []).map((c, i) => (
                <div key={i} className="flex justify-between items-center group cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-stone-200 group-hover:text-white transition-colors truncate w-36">
                      {c.razon_social}
                    </p>
                    <p className="text-[9px] text-stone-500 font-black uppercase tracking-tighter">
                      S/ {Number(c.total).toLocaleString('es-PE')}
                    </p>
                  </div>
                  <ArrowUpRight size={15} className="text-emerald-400" />
                </div>
              ))}
              {(data?.topClientes ?? []).length === 0 && (
                <p className="text-[10px] text-stone-600 uppercase font-bold text-center py-4">
                  Sin datos disponibles
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardSection>
  );
}