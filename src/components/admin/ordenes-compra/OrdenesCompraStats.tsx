'use client';

import { Package, Clock, CheckCircle, Wallet } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface Stats {
  total: number;
  pendientes: number;
  confirmadas: number;
  montoTotal: number;
}

interface OrdenesCompraStatsProps {
  stats: Stats;
}

function formatMontoSimplificado(monto: number): string {
  if (monto >= 1_000_000_000) return `S/ ${(monto / 1_000_000_000).toFixed(1)}B`;
  if (monto >= 1_000_000) return `S/ ${(monto / 1_000_000).toFixed(1)}M`;
  if (monto >= 1_000) return `S/ ${(monto / 1_000).toFixed(1)}K`;
  return `S/ ${monto.toLocaleString('es-PE')}`;
}

export function OrdenesCompraStats({ stats }: OrdenesCompraStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
      <StatCard
        title="Total OC"
        value={stats.total}
        icon={Package}
        color="pink"
      />
      <StatCard
        title="Pendientes"
        value={stats.pendientes}
        icon={Clock}
        color="orange"
        isActive={stats.pendientes > 0}
      />
      <StatCard
        title="Confirmadas"
        value={stats.confirmadas}
        icon={CheckCircle}
        color="emerald"
        isActive={stats.confirmadas > 0}
      />
      <StatCard
        title="Monto Activo"
        value={formatMontoSimplificado(stats.montoTotal)}
        icon={Wallet}
        color="indigo"
      />
    </div>
  );
}