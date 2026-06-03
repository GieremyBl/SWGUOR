"use client";

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { COMPANY_PALETTE, AreaTip } from './DashboardUtils';

// Definición de tipos estrictos
interface VentasData {
  mes: string;
  ventas: number;
}

interface ProductoData {
  nombre: string;
  cantidad: number;
}

interface VentaRecienteData {
  cliente?: string;
  clientes?: { razon_social: string };
  created_at: string;
  total?: number;
  total_pagado?: number;
  estado: string;
}

interface StockCriticoData {
  nombre: string;
  stock_actual: number | { toNumber(): number };
  unidad?: string;
  unidad_medida?: string;
}

// ─── Alias de paleta centralizada ────────────────────────────────────────────
const C = COMPANY_PALETTE;

const cardStyle: React.CSSProperties = {
  background:   C.bg,
  border:       `1px solid ${C.border}`,
  borderRadius: 16,
  padding:      '20px 22px',
  boxShadow:    '0 1px 3px 0 rgb(0 0 0 / 0.07)',
  height:       '100%',
};

const titleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2,
};

const subStyle: React.CSSProperties = {
  fontSize: 10, color: C.mid,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16,
};

// ─── UTILIDAD ─────────────────────────────────────────────────────────────────
export function fmtCompact(value: number): string {
  if (value >= 1_000_000) return `S/ ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)     return `S/ ${(value / 1_000).toFixed(1)}k`;
  return `S/ ${value.toLocaleString('es-PE')}`;
}

// ─── 1. STAT CARD ─────────────────────────────────────────────────────────────
export function SparkKpiCard({
  label,
  value,
  delta,
  icon: Icon,
  accentColor = C.accent,
}: {
  label:        string;
  value:        string | number;
  delta:        number;
  icon:         React.ElementType;
  sparkData?:   number[];
  accentColor?: string;
}) {
  const isUp = delta >= 0;

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: 14 }}>
        <div style={{
          display:      'inline-flex',
          padding:      8,
          background:   C.beige,
          borderRadius: 10,
          border:       `1px solid ${C.border}`,
        }}>
          <Icon size={16} color={accentColor} />
        </div>
      </div>

      <div style={{
        fontSize: 26, fontWeight: 800, color: C.dark,
        letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 4,
      }}>
        {value}
      </div>

      <div style={subStyle}>{label}</div>

      <div style={{ fontSize: 11, fontWeight: 600, color: isUp ? '#10b981' : '#ef4444' }}>
        {isUp ? '↑' : '↓'} {Math.abs(delta)}%{' '}
        <span style={{ color: C.mid, fontWeight: 400 }}>vs mes ant.</span>
      </div>
    </div>
  );
}

// ─── 2. GRÁFICO DE VENTAS ─────────────────────────────────────────────────────
export function VentasMensualesChart({
  data,
  accentColor = C.accent,
}: {
  data:          VentasData[];
  accentColor?:  string;
}) {
  return (
    <div style={cardStyle}>
      <div style={titleStyle}>Ventas Mensuales</div>
      <div style={subStyle}>Tendencia de facturación</div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={accentColor} stopOpacity={0.15} />
              <stop offset="95%" stopColor={accentColor} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 10, fill: C.mid }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => fmtCompact(v).replace('S/ ', '')}
            tick={{ fontSize: 10, fill: C.mid }}
            axisLine={false} tickLine={false}
            width={40}
          />
          <Tooltip content={<AreaTip accentColor={accentColor} />} />
          <Area
            type="monotone"
            dataKey="ventas"
            stroke={accentColor}
            fillOpacity={1}
            fill="url(#gradVentas)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: accentColor, stroke: C.bg, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 3. RANKING DE PRODUCTOS ──────────────────────────────────────────────────
export function RankingProductos({
  data,
  accentColor = C.accent,
}: {
  data:         ProductoData[];
  accentColor?: string;
}) {
  const maxQ = Math.max(...(data?.map((d) => d.cantidad) ?? [1]), 1);

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>Top Productos</div>
      <div style={subStyle}>Más pedidos</div>

      {(!data || data.length === 0) ? (
        <div style={{ fontSize: 12, color: C.mid, textAlign: 'center', padding: '20px 0' }}>
          Sin datos
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.map((p, i) => {
            const pct = (p.cantidad / maxQ) * 100;
            return (
              <div key={i}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 12, marginBottom: 5,
                }}>
                  <span style={{
                    color: C.text, fontWeight: 600, maxWidth: '70%',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {i === 0 && (
                      <span style={{
                        display: 'inline-block', marginRight: 6,
                        fontSize: 9, fontWeight: 800, background: accentColor,
                        color: C.white, borderRadius: 4, padding: '1px 5px',
                        verticalAlign: 'middle',
                      }}>
                        #1
                      </span>
                    )}
                    {p.nombre}
                  </span>
                  <span style={{ color: C.mid, fontWeight: 700, flexShrink: 0 }}>
                    {p.cantidad} u.
                  </span>
                </div>
                <div style={{
                  height: 5, background: C.beige,
                  borderRadius: 99, overflow: 'hidden',
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: i === 0 ? accentColor : C.border,
                    borderRadius: 99,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 4. ÚLTIMAS VENTAS ────────────────────────────────────────────────────────
export function UltimasVentas({
  data,
  accentColor = C.accent,
}: {
  data:         VentaRecienteData[];
  accentColor?: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={titleStyle}>Ventas Recientes</div>
      <div style={subStyle}>Últimas transacciones</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data?.map((v, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 12px', background: C.bgSoft, borderRadius: 10,
            border: `1px solid ${C.border}`,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                {v.cliente || v.clientes?.razon_social}
              </div>
              <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>
                {new Date(v.created_at).toLocaleDateString('es-PE')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.dark }}>
                {fmtCompact(Number(v.total || v.total_pagado || 0))}
              </div>
              <div style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', marginTop: 2,
                color: v.estado === 'pagado' ? '#10b981' : accentColor,
              }}>
                {v.estado}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. STOCK CRÍTICO ─────────────────────────────────────────────────────────
export function StockCriticoList({ data }: { data: StockCriticoData[] }) {
  return (
    <div style={cardStyle}>
      <div style={titleStyle}>Stock Crítico</div>
      <div style={subStyle}>Insumos por agotarse</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data?.length === 0 ? (
          <div style={{ fontSize: 12, color: '#10b981', textAlign: 'center', padding: '12px 0' }}>
            Todo en orden
          </div>
        ) : (
          data?.map((item, i) => {
            const stockFormateado =
              typeof item.stock_actual === 'object' && item.stock_actual !== null && 'toNumber' in item.stock_actual
                ? item.stock_actual.toNumber()
                : Number(item.stock_actual ?? 0);

            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px',
                background: C.cream,
                borderRadius: 8,
                border: `1px solid ${C.peach}`,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: C.secondary,
                  maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.nombre}
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.accent, flexShrink: 0 }}>
                  {stockFormateado} {item.unidad || item.unidad_medida}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export { Sk } from './DashboardUtils';