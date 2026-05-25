'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Users, AlertTriangle, ShoppingCart,
  RefreshCw, AlertOctagon, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardSection } from './DashboardSection';
import {
  SparkKpiCard,
  StockCriticoList,
  RankingProductos,
   fmtCompact, 
} from './widgets/DashboardWidgets';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';
import DashboardCharts from './DashboardCharts';
import type { insumo, pedidos } from '@prisma/client';
import type { VentaMensual, DashboardKpis, TopProducto } from '@/lib/services/dashboard.service';
import { Button } from '@/components/ui/button';

type OrdenConCliente = pedidos & { clientes: { razon_social: string } | null };

interface ApiData {
  kpis:            DashboardKpis;
  ventasMensuales: VentaMensual[];
  recentOrders:    OrdenConCliente[];
  criticalStock:   insumo[];
  topProductos:    TopProducto[];
}

// ─── Paleta GUOR ──────────────────────────────────────────────────────────────
const P = COMPANY_PALETTE;

export default function DashboardAdministrador() {
  const [filter, setFilter]         = useState('30');
  const [data, setData]             = useState<ApiData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/dashboard?days=${filter}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 p-6 text-center">
      <AlertOctagon className="w-8 h-8 text-red-400" />
      <h2 className="font-bold text-guor-ink">Error en el panel</h2>
      <p className="text-xs text-guor-soft">{error}</p>
      <Button
        onClick={() => fetchData()}
        style={{ background: P.accent, color: '#fff', borderRadius: 8 }}
      >
        Reintentar
      </Button>
    </div>
  );

  const kpis          = data?.kpis;
  const recentOrders  = data?.recentOrders  ?? [];
  const criticalStock = data?.criticalStock ?? [];
  const topProductos  = data?.topProductos  ?? [];

  // ── Acciones del header ───────────────────────────────────────────────────
  const headerActions = (
    <>
      {/* Filtros de período */}
      <div style={{
        display: 'flex', background: '#ece9e8',
        borderRadius: 8, padding: 3, gap: 2,
      }}>
        {['7', '30', '90'].map((d) => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              fontSize: 10, fontWeight: 800,
              textTransform: 'uppercase',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.15s',
              background: filter === d ? P.white   : 'transparent',
              color:      filter === d ? P.accent  : P.muted,
              boxShadow:  filter === d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {d}D
          </button>
        ))}
      </div>

      {/* Botón actualizar */}
      <button
        onClick={() => fetchData(true)}
        disabled={refreshing}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 8,
          fontSize: 10, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          background: P.text, color: P.white, border: 'none',
          cursor: refreshing ? 'not-allowed' : 'pointer',
          opacity: refreshing ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <RefreshCw size={12} className={cn(refreshing && 'animate-spin')} />
        {refreshing ? 'Actualizando...' : 'Actualizar'}
      </button>
    </>
  );

  const estadoColor = (estado: string) => {
    if (estado === 'entregado')           return '#16a34a';
    if (estado === 'pendiente')           return '#d97706';
    if (estado === 'listo_para_despacho') return '#0284c7';
    return P.accent;
  };

  return (
    <DashboardSection
      title="Panel de Administración"
      subtitle={`Resumen de operaciones y métricas de control en los últimos ${filter} días`}
      role="administrador"
      actions={headerActions}
    >

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SparkKpiCard label="Ventas Reales"    value={kpis ? fmtCompact(Number(kpis.total_ventas)) : '—'} delta={12}  icon={TrendingUp}   />
        <SparkKpiCard label="Clientes Activos" value={kpis?.total_clientes ?? '—'}   delta={5}   icon={Users}         />
        <SparkKpiCard label="Órdenes Totales"  value={kpis?.nuevas_ordenes ?? '—'}   delta={8}   icon={ShoppingCart}  />
        <SparkKpiCard label="Alertas Insumos"  value={kpis?.stock_alerta ?? '—'}     delta={-2}  icon={AlertTriangle} accentColor="#dc2626" />
      </div>

      {/* ── Gráfico ───────────────────────────────────────────────────────── */}
      <DashboardCharts rol="administrador" data={data?.ventasMensuales} />

      {/* ── Ranking + Stock ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          {loading
            ? <div style={{ height: 200, background: P.white, border: `1px solid ${P.border}`, borderRadius: 12 }} className="animate-pulse" />
            : <RankingProductos data={topProductos} accentColor={P.accent} />
          }
        </div>
        <div className="lg:col-span-1">
          <StockCriticoList data={criticalStock} />
        </div>
      </div>

      {/* ── Órdenes Recientes ─────────────────────────────────────────────── */}
      <div style={{
        background: P.white, border: `1px solid ${P.border}`,
        borderRadius: 12, padding: '20px 24px',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.07)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: P.text,
              textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Últimos Movimientos
            </h2>
            <p style={{ fontSize: 10, color: P.muted, marginTop: 2,
              textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Actividad reciente de pedidos
            </p>
          </div>
          <Link
            href="/admin/Panel-Administrativo/pedidos"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 800, color: P.accent,
              border: `1px solid ${P.accent}30`,
              padding: '5px 12px', borderRadius: 6,
              textDecoration: 'none', textTransform: 'uppercase',
              transition: 'all 0.15s',
            }}
          >
            Ver Todo <ArrowUpRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{
                height: 120, background: P.bg,
                border: `1px solid ${P.border}`, borderRadius: 10,
              }} className="animate-pulse" />
            ))
          ) : recentOrders.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <ShoppingCart size={32} style={{ color: P.border, margin: '0 auto 8px' }} />
              <span style={{ fontSize: 11, color: P.muted, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Sin actividad reciente
              </span>
            </div>
          ) : (
            recentOrders.map((o) => (
              <div
                key={o.id}
                style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: P.white, border: `1px solid ${P.border}`,
                  transition: 'all 0.2s',
                }}
                className="hover:border-guor-200 hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: P.accent,
                    background: P.surface, padding: '2px 7px',
                    borderRadius: 4, textTransform: 'uppercase',
                  }}>
                    ORD-{String(o.id).padStart(4, '0')}
                  </span>
                  <ArrowUpRight size={12} style={{ color: P.border }} />
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: P.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginBottom: 4 }}>
                  {o.clientes?.razon_social ?? 'Cliente Final'}
                </p>
                <p style={{ fontSize: 16, fontWeight: 800, color: P.text,
                  letterSpacing: '-0.02em', marginBottom: 10 }}>
                  S/ {Number(o.total ?? 0).toLocaleString('es-PE')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5,
                  paddingTop: 10, borderTop: `1px solid ${P.border}` }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: estadoColor(o.estado ?? ''),
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: P.muted,
                    textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {o.estado}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </DashboardSection>
  );
}