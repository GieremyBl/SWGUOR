'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnaliticaFinancieraTendenciaMes } from '@/lib/schemas/reporte-analitica-financiera';
import type { MonedaAnaliticaFiltro } from '@/lib/constants/analitica-financiera';
import { formatMontoAnalitica } from '@/lib/helpers/analitica-financiera.helper';

interface Props {
  data: AnaliticaFinancieraTendenciaMes[];
  moneda: MonedaAnaliticaFiltro;
}

function TooltipContent({
  active,
  payload,
  label,
  moneda,
}: {
  active?: boolean;
  payload?: readonly any[];
  label?: string | number;
  moneda: MonedaAnaliticaFiltro;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[#e4c28a] bg-white p-3 shadow-lg text-sm">
      <p className="font-bold text-[#231e1d] mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-[#6b5b52]" style={{ color: entry.color }}>
          {entry.dataKey === 'ventas' ? 'Ventas' : 'Pagos recibidos'}:{' '}
          <span className="font-semibold text-[#231e1d]">
            {formatMontoAnalitica(entry.value, moneda)}
          </span>
        </p>
      ))}
    </div>
  );
}

export function AnaliticaFinancieraTrendChart({ data, moneda }: Props) {
  return (
    <div className="bg-[#fbddd3] border border-[#e4c28a] rounded-3xl p-6 h-[420px]">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#231e1d]">Tendencia de Recaudación</h2>
        <p className="text-[#6b5b52] mt-1 text-sm">
          Comparativo mensual: ventas totales vs. pagos recibidos (últimos 12 meses)
        </p>
      </div>

      {data.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center text-[#6b5b52] text-sm">
          Sin datos para el periodo seleccionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="82%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pagosGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#e4c28a" vertical={false} />
            <XAxis dataKey="mes" stroke="#6b5b52" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#6b5b52"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) =>
                moneda === 'USD' ? `$${(v / 1000).toFixed(0)}k` : `S/${(v / 1000).toFixed(0)}k`
              }
              width={48}
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <TooltipContent active={active} payload={payload} label={label} moneda={moneda} />
              )}
            />
            <Legend
              verticalAlign="top"
              height={28}
              formatter={(value) => (value === 'ventas' ? 'Ventas totales' : 'Pagos recibidos')}
            />
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#ventasGradient)"
              dot={{ r: 3, fill: '#6366f1' }}
            />
            <Area
              type="monotone"
              dataKey="pagos"
              stroke="#059669"
              strokeWidth={2.5}
              fill="url(#pagosGradient)"
              dot={{ r: 3, fill: '#059669' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
