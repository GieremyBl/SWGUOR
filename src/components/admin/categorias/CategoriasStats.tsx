'use client';

import { Layers, CheckCircle2, XCircle } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface CategoriasStatsProps {
  stats: { total: number; activas: number; inactivas: number };
  statusFilter: boolean | null;
  onFilterChange: (filter: boolean | null) => void;
}

export function CategoriasStats({ stats, statusFilter, onFilterChange }: CategoriasStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Total General"
        value={stats.total}
        icon={Layers}
        color="pink"
        isActive={statusFilter === null}
        onClick={() => onFilterChange(null)}
      />
      <StatCard
        title="Activas"
        value={stats.activas}
        icon={CheckCircle2}
        color="emerald"
        isActive={statusFilter === true}
        onClick={() => onFilterChange(true)}
      />
      <StatCard
        title="Inactivas"
        value={stats.inactivas}
        icon={XCircle}
        color="orange"
        isActive={statusFilter === false}
        onClick={() => onFilterChange(false)}
      />
    </div>
  );
}