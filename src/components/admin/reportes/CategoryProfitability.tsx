'use client';

import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Paleta rose-warm: acento principal + tonos complementarios cálidos
const CORPORATE_COLORS = [
  '#e11d48', // rose-600  — acento principal
  '#fb7185', // rose-400  — tono medio
  '#fda4af', // rose-300  — tono suave
  '#f43f5e', // rose-500  — intermedio
  '#be123c', // rose-700  — peso
];

interface CategoryProfitabilityProps {
  data: any[];
  CustomTooltip: React.ComponentType<any>;
}

export default function CategoryProfitability({ data, CustomTooltip }: CategoryProfitabilityProps) {
  return (
    <Card className="border border-border shadow-sm rounded-[2rem] bg-card p-6">
      <div className="mb-6">
        <h3 className="text-base font-bold text-foreground tracking-tight">
          Rentabilidad por Categoría
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Distribución monetaria por líneas de producción
        </p>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
              tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
              content={<CustomTooltip />}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CORPORATE_COLORS[index % CORPORATE_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}