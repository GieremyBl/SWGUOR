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

interface RevenueChartProps {
  data: any[];
  totalPeriodo: number;
  formatCurrency: (val: number) => string;
  isMounted: boolean;
  CustomTooltip: React.ComponentType<any>;
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
        <div className="flex justify-between items-end">
          <div>
            <CardTitle className="text-base font-bold text-foreground tracking-tight">
              Rendimiento Financiero
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Historial acumulado de operaciones reales
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-foreground tracking-tight">
              {formatCurrency(totalPeriodo)}
            </p>
            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-1">
              Total Periodo
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 h-[340px]">
        {isMounted && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Gradiente rose en lugar de indigo */}
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e11d48" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0}    />
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
                tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`}
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
        )}
      </CardContent>
    </Card>
  );
}