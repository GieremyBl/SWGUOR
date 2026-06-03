'use client';

import { ClipboardList, Timer, CheckCircle2 } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface OrdenesProduccionStatsProps {
  stats:        { total: number; enProceso: number; completadas: number };
  activeFilter: string;
  onFilterChange: (active: string, etapa: string) => void;
}

export function OrdenesProduccionStats({ stats, activeFilter, onFilterChange }: OrdenesProduccionStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Total Órdenes"
        value={stats.total}
        icon={ClipboardList}
        color="pink"
        isActive={activeFilter === 'all'}
        onClick={() => onFilterChange('all', 'all')}
      />
      <StatCard
        title="En Costura"
        value={stats.enProceso}
        icon={Timer}
        color="orange"
        isActive={activeFilter === 'costura'}
        onClick={() => onFilterChange('costura', 'costura')}
      />
      <StatCard
        title="Completadas"
        value={stats.completadas}
        icon={CheckCircle2}
        color="emerald"
        isActive={activeFilter === 'entrega'}
        onClick={() => onFilterChange('entrega', 'entrega')}
      />
    </div>
  );
}