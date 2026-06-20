'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ManufacturaEtapaFunnel } from '@/lib/schemas/reporte-eficiencia-manufactura';

interface Props {
  data: ManufacturaEtapaFunnel[];
  loading?: boolean;
}

const BAR_COLORS = [
  '#6366f1',
  '#818cf8',
  '#a5b4fc',
  '#ec4899',
  '#f472b6',
  '#fb7185',
  '#f97316',
  '#fbbf24',
  '#34d399',
];

export function ManufacturaEtapasChart({ data, loading }: Props) {
  if (loading) {
    return <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[460px] animate-pulse" />;
  }

  const chartData = [...data].sort((a, b) => b.ordenes - a.ordenes);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-[460px]">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Embudo de Etapas Productivas</h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Órdenes activas distribuidas por etapa actual de producción
        </p>
      </div>

      {chartData.every((item) => item.ordenes === 0) ? (
        <div className="h-[360px] flex items-center justify-center text-slate-500 italic text-sm">
          No hay órdenes activas en etapas de manufactura
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="88%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="label"
              width={130}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value: any) => {
                if (value === undefined || value === null) return ['', ''];
                return [`${Number(value)} OP`, 'Órdenes'];
              }}
              labelStyle={{ fontWeight: 700 }}
            />
            <Bar dataKey="ordenes" radius={[0, 8, 8, 0]} barSize={22}>
              {chartData.map((entry, index) => (
                <Cell key={entry.etapa} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}