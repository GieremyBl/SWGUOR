'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ConversionTasaCierreMes } from '@/lib/schemas/reporte-conversion-comercial';
import { formatPorcentaje } from '@/lib/helpers/conversion-comercial.helper';

interface Props {
  data: ConversionTasaCierreMes[];
  loading?: boolean;
}

export function ConversionTasaCierreChart({ data, loading }: Props) {
  if (loading) {
    return <div className="bg-[#fbddd3] border border-[#e4c28a] rounded-3xl p-6 h-[380px] animate-pulse" />;
  }

  return (
    <div className="bg-[#fbddd3] border border-[#e4c28a] rounded-3xl p-6 h-[380px]">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#231e1d]">Tasa de Cierre por Mes</h2>
        <p className="text-sm text-[#6b5b52] mt-0.5">
          Porcentaje de cotizaciones convertidas en pedido (últimos 12 meses)
        </p>
      </div>

      <ResponsiveContainer width="100%" height="82%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="4 4" stroke="#e4c28a" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#6b5b52" />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11 }}
            stroke="#6b5b52"
            allowDecimals={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11 }}
            stroke="#6b5b52"
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip
            formatter={(value: any, name: any) => {
              // Validamos que el valor no sea nulo ni indefinido
              if (value === undefined || value === null) return ['', ''];

              const numValue = Number(value);

              if (name === 'tasa_cierre_pct') {
                return [formatPorcentaje(numValue), 'Tasa de cierre'];
              }

              const label = name === 'creadas' ? 'Creadas' : 'Convertidas';
              return [numValue, label];
            }}
          />
          <Bar yAxisId="left" dataKey="creadas" fill="#a5b4fc" name="creadas" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="left" dataKey="convertidas" fill="#34d399" name="convertidas" radius={[4, 4, 0, 0]} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="tasa_cierre_pct"
            stroke="#e11d48"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#e11d48' }}
            name="tasa_cierre_pct"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}