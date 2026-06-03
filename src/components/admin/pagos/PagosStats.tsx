'use client';

import { DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface PagosStatsProps {
  stats: {
    total:       number;
    pendientes:  number;
    verificados: number;
    montoTotal:  number;
  };
  estadoFilter:    string;
  onFilterChange:  (filtro: string) => void;
}

export function PagosStats({ stats, estadoFilter, onFilterChange }: PagosStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Pagos"
        value={stats.total}
        icon={DollarSign}
        color="slate"
        isActive={estadoFilter === 'todos'}
        onClick={() => onFilterChange('todos')}
      />
      <StatCard
        title="Pendientes"
        value={stats.pendientes}
        icon={Clock}
        color="orange"
        isActive={estadoFilter === 'pendiente'}
        onClick={() => onFilterChange('pendiente')}
      />
      <StatCard
        title="Verificados"
        value={stats.verificados}
        icon={CheckCircle2}
        color="emerald"
        isActive={estadoFilter === 'verificado'}
        onClick={() => onFilterChange('verificado')}
      />
      <StatCard
        title="Monto Verificado"
        value={`S/ ${stats.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
        icon={DollarSign}
        color="blue"
        disabled
      />
    </div>
  );
}