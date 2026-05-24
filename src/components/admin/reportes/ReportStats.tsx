'use client';

import { TrendingUp, ShoppingBag, Zap, Target } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface ReportStatsProps {
  metrics: {
    total: number;
    pedidos: number;
    produccionEnCurso: number;
  } | null;
  formatCurrency: (val: number) => string;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `S/ ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)     return `S/ ${(value / 1_000).toFixed(1)}K`;
  return `S/ ${value.toFixed(2)}`;
}

export default function ReportStats({ metrics }: ReportStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Ventas Totales"
        value={formatCompact(metrics?.total ?? 0)}
        icon={TrendingUp}
        color="indigo"
        disabled
      />
      <StatCard
        title="Pedidos Activos"
        value={metrics?.pedidos ?? 0}
        icon={ShoppingBag}
        color="slate"
        disabled
      />
      <StatCard
        title="Capital en Proceso"
        value={formatCompact(metrics?.produccionEnCurso ?? 0)}
        icon={Zap}
        color="emerald"
        disabled
      />
      <StatCard
        title="Eficiencia Global"
        value="94.2%"
        icon={Target}
        color="amber"
        disabled
      />
    </div>
  );
}