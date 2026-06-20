'use client';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { ConversionMotivoPerdida } from '@/lib/schemas/reporte-conversion-comercial';
import { formatPorcentaje } from '@/lib/helpers/conversion-comercial.helper';
import { TrendingDown } from 'lucide-react';

interface Props {
  motivos: ConversionMotivoPerdida[];
  loading?: boolean;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#94a3b8'];

export function ConversionAnalisisPerdida({ motivos, loading }: Props) {
  if (loading) {
    return <div className="bg-white border border-red-100 rounded-3xl p-6 h-full min-h-[360px] animate-pulse" />;
  }

  return (
    <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-red-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Análisis de Pérdida</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Motivos inferidos en cotizaciones con estado expirada (vencidas)
          </p>
        </div>
      </div>

      {motivos.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-12 text-center">
          No hay cotizaciones expiradas registradas para analizar
        </p>
      ) : (
        <>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={motivos}
                  dataKey="total"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {motivos.map((entry, index) => (
                    <Cell key={entry.motivo} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, _name, item) => [
                    `${value} (${formatPorcentaje(item.payload.porcentaje)})`,
                    item.payload.label,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-4 space-y-2">
            {motivos.map((motivo, index) => (
              <li
                key={motivo.motivo}
                className="flex items-center justify-between text-sm border-b border-slate-50 pb-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-700">{motivo.label}</span>
                </div>
                <span className="font-bold tabular-nums text-slate-900">
                  {motivo.total} · {formatPorcentaje(motivo.porcentaje)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
