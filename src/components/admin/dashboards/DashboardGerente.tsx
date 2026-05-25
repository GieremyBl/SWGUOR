"use client";

import React from 'react';
import {
  TrendingUp, DollarSign, Users, Activity,
  ArrowUpRight, Briefcase, Target, Award,
  PieChart as PieIcon, ChevronRight,
} from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { SparkKpiCard, VentasMensualesChart, RankingProductos } from './widgets/DashboardWidgets';
import { ROLE_PALETTES } from './widgets/DashboardUtils';
import DashboardCharts from './DashboardCharts';
import type { pedidos } from '@prisma/client';
import type { VentaMensual, DashboardKpis } from '@/lib/services/dashboard.service';

const C = ROLE_PALETTES.gerente;

interface GerenteData {
  kpis: DashboardKpis;
  sparklines: any;
  ventasMensuales: VentaMensual[];
  recentOrders: (pedidos & { clientes: { razon_social: string } | null })[];
  balanceData: any[];
  rankingProductos: any[];
}

export default function GerenteDashboard() {
  const [data, setData] = React.useState<GerenteData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/admin/dashboard?days=30')
      .then(r => r.json())
      .then(json => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.cream}`, borderTop: `3px solid ${C.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Calculando métricas estratégicas...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const k = data?.kpis;
  const b = data?.balanceData ?? [];

  const balanceIcons = [
    { icon: Award, bg: C.bgSoft, color: C.accent },
    { icon: Briefcase, bg: C.cream, color: C.secondary },
    { icon: Target, bg: '#fff7ed', color: '#ea580c' },
  ];

  return (
    <DashboardSection title="Panel de Gerencia" role="gerente" subtitle="Visibilidad estratégica, métricas de rentabilidad y salud financiera">

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        <SparkKpiCard label="Ingresos Totales"   value={`S/ ${Number(k?.facturacion ?? 0).toLocaleString()}`} delta={12} icon={DollarSign} accentColor={C.accent} />
        <SparkKpiCard label="Nuevos Clientes"    value={k?.clientesB2B ?? 0}         delta={5}  icon={Users}      accentColor={C.accent} />
        <SparkKpiCard label="Pedidos Activos"    value={k?.pedidosActivos ?? 0}       delta={2}  icon={Activity}   accentColor={C.accent} />
        <SparkKpiCard label="Cotiz. Pendientes"  value={k?.cotizacionesPend ?? 0}     delta={4}  icon={TrendingUp} accentColor={C.accent} />
      </div>

      {/* ── Gráfico + Balance ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        <DashboardCharts rol="gerente" data={data?.ventasMensuales} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {b.map((item: any, idx: number) => {
            const cfg = balanceIcons[idx] ?? balanceIcons[0];
            const Icon = cfg.icon;
            return (
              <div key={idx} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={cfg.color} />
                </div>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: C.dark, letterSpacing: '-0.02em' }}>{item.value}</p>
                </div>
              </div>
            );
          })}

          {/* Meta mensual */}
          <div style={{ background: C.accent, borderRadius: 14, padding: '20px 18px', color: '#fff', position: 'relative', overflow: 'hidden', marginTop: 4 }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', opacity: 0.75, marginBottom: 8 }}>Meta Mensual</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>82%</span>
              <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.7 }}>
                S/ {Math.round((k?.facturacion ?? 0) / 1000)}k de S/ 55k
              </span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: '82%', background: '#fff', borderRadius: 99 }} />
            </div>
            <PieIcon size={90} style={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.08 }} />
          </div>
        </div>
      </div>

      {/* ── Ventas + Productos + Clientes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Flujo de caja */}
        <div style={{ gridColumn: 'span 2', background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.dark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flujo de Caja Mensual</p>
              <p style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>Comparativa ingresos vs proyectado</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[{ label: 'Ingresos', color: C.accent }, { label: 'Proyectado', color: C.border }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <VentasMensualesChart data={data?.ventasMensuales ?? []} accentColor={C.accent} />
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <RankingProductos data={data?.rankingProductos ?? []} accentColor={C.accent} />

          {/* Top clientes */}
          <div style={{ background: C.dark, borderRadius: 14, padding: '18px 18px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>Top Clientes (LTV)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(data?.recentOrders ?? []).slice(0, 3).map((o: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{o.clientes?.razon_social ?? 'S/N'}</p>
                    <p style={{ fontSize: 9, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                      S/ {Number(o.total ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <ArrowUpRight size={14} color="#10b981" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardSection>
  );
}