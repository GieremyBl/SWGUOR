"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { TrendingUp, ShoppingCart, Package } from 'lucide-react';
import type { RolPaleta } from './widgets/DashboardUtils';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';
import { fmtCompact } from './widgets/DashboardWidgets';

// ─── Paleta ERP ───────────────────────────────────────────────────────────────
const P = COMPANY_PALETTE;

interface DashboardChartsProps {
  minimal?:  boolean;
  rol?:      RolPaleta;
  data?:     any[];
}

export default function DashboardCharts({
  minimal = false,
  rol,
  data: externalData,
}: DashboardChartsProps) {
  const [isMounted, setIsMounted]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [ventasData, setVentasData] = useState<any[]>([]);

  useEffect(() => { setIsMounted(true); }, []);

  const fetchData = useCallback(async () => {
    if (externalData) {
      setVentasData(externalData);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res  = await fetch('/api/admin/charts?days=30');
      const json = await res.json();
      setVentasData(json.ventasData || []);
    } catch (err) {
      console.error('Error cargando gráficas:', err);
    } finally {
      setLoading(false);
    }
  }, [externalData]);

  useEffect(() => {
    if (isMounted) fetchData();
  }, [isMounted, fetchData]);

  if (!isMounted) return null;

  const totalVentas = ventasData.reduce(
    (acc, d) => acc + (Number(d.ventas) || 0), 0
  );

  return (
    <div style={{
      background:   P.bg,
      border:       `1px solid ${P.border}`,
      borderRadius: 12,
      padding:      '20px 24px',
      boxShadow:    '0 1px 3px 0 rgb(0 0 0 / 0.07)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: P.text,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            Actividad
          </p>
          <p style={{ fontSize: 10, color: P.muted, textTransform: 'uppercase',
            letterSpacing: '0.05em' }}>
            Rendimiento {rol ? rol.replace('_', ' ') : 'Institucional'}
          </p>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          background: '#f0f4ff', color: P.accent,
          border: `1px solid #c0d0ff`,
        }}>
          ↑ +12.5%
        </div>
      </div>

      {/* Gráfico */}
      <div style={{ width: '100%', height: minimal ? 180 : 300 }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: P.accent,
                animation: `bounce 0.8s ${i * 0.15}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
        ) : ventasData.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 12, color: P.muted, fontWeight: 500 }}>
            Sin datos para mostrar
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ventasData} margin={{ top: 8, right: 8, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradErp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={P.accent} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={P.accent} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.border} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 10, fontWeight: 600, fill: P.muted }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`;
                  return String(v);
                }}
                tick={{ fontSize: 10, fontWeight: 600, fill: P.muted }}
                axisLine={false} tickLine={false}
                width={42}
              />
              <Tooltip content={<ChartTooltip accent={P.accent} />} />
              <Area
                type="monotone"
                dataKey="ventas"
                stroke={P.accent}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradErp)"
                dot={false}
                activeDot={{ r: 4, fill: P.accent, stroke: P.bg, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Mini stats */}
      {!minimal && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 16, marginTop: 20,
          paddingTop: 16, borderTop: `1px solid ${P.border}`,
        }}>
          <MiniStat label="Ventas"  value={fmtCompact(totalVentas)} icon={<TrendingUp  size={13} />} accent={P.accent} />
          <MiniStat label="Pedidos" value="48"                       icon={<ShoppingCart size={13} />} accent={P.accent} />
          <MiniStat label="Meta"    value="92%"                      icon={<Package      size={13} />} accent={P.green}  />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, icon, accent }: {
  label: string; value: string; icon: React.ReactNode; accent: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: accent }}>
        {icon}
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#64748b' }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
        {value}
      </span>
    </div>
  );
}

function ChartTooltip({ active, payload, label, accent }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f172a',
      border: `1px solid ${accent}40`,
      borderRadius: 8,
      padding: '7px 11px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      <p style={{ fontSize: 9, color: accent, textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: 3 }}>{label}</p>
      <p style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
        {fmtCompact(Number(payload[0].value ?? 0))}
      </p>
    </div>
  );
}