'use client';

import { ShoppingBag, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface OrdenesCompraStatsProps {
  stats: {
    total:      number;
    pendientes: number;
    confirmadas: number;
    montoTotal: number;
  };
}

export function OrdenesCompraStats({ stats }: OrdenesCompraStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total OC"
        value={stats.total}
        icon={ShoppingBag}
        color="slate"
      />
      <StatCard
        title="Pendientes"
        value={stats.pendientes}
        icon={Clock}
        color="orange"
      />
      <StatCard
        title="Confirmadas"
        value={stats.confirmadas}
        icon={CheckCircle2}
        color="emerald"
      />
      <StatCard
        title="Monto Activo"
        value={`S/ ${stats.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`}
        icon={DollarSign}
        color="blue"
        disabled
      />
    </div>
  );
}