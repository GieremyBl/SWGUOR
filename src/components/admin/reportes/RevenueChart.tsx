'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// Estructura estricta para los puntos de rendimiento financiero
export interface RevenueItem {
  fecha: string;
  ventas: number;
}

interface RevenueChartProps {
  data: RevenueItem[];
  totalPeriodo: number;
  formatCurrency: (val: number) => string;
  isMounted: boolean;
  // Tipado exacto y seguro para el componente Tooltip personalizado de Recharts
  CustomTooltip: React.ComponentType<TooltipProps<ValueType, NameType>>;
}

export default function RevenueChart({
  data,
  totalPeriodo,
  formatCurrency,
  isMounted,
  CustomTooltip,
}: RevenueChartProps) {
  return (
    <Card className="border border-border shadow-sm rounded-[2rem] bg-card overflow-hidden">
      <CardHeader className="p-6 pb-2">
        <div className="flex justify-between items-end gap-4">
          <div className="min-w-0">
            <CardTitle className="text-base font-bold text-foreground tracking-tight">
              Rendimiento Financiero
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Historial acumulado de operaciones reales
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-foreground tracking-tight break-all">
              {formatCurrency(totalPeriodo)}
            </p>
            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-1">
              Total Periodo
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 h-[340px]">
        {isMounted && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="fecha"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                tickFormatter={(v: number) => `S/${(v / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="ventas"
                stroke="#e11d48"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorSales)"
                dot={{ r: 3, fill: '#e11d48', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#e11d48' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 border border-dashed rounded-2xl">
            <p className="font-medium text-xs">Sin información financiera en el periodo seleccionado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}