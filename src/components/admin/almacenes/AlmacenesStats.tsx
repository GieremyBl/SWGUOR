'use client';

import { Layout, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface AlmacenesStatsProps {
  stats: { total: number; activos: number; inactivos: number; capacidadTotal: number };
  statusFilter: string;
  onFilterChange: (filter: string) => void;
}

export function AlmacenesStats({ stats, statusFilter, onFilterChange }: AlmacenesStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Almacenes"
        value={stats.total}
        icon={Layout}
        color="slate"
        isActive={statusFilter === 'todos'}
        onClick={() => onFilterChange('todos')}
      />
      <StatCard
        title="Activos"
        value={stats.activos}
        icon={CheckCircle2}
        color="emerald"
        isActive={statusFilter === 'activo'}
        onClick={() => onFilterChange('activo')}
      />
      <StatCard
        title="Inactivos"
        value={stats.inactivos}
        icon={XCircle}
        color="orange"
        isActive={statusFilter === 'inactivo'}
        onClick={() => onFilterChange('inactivo')}
      />
      <StatCard
        title="Capacidad Total"
        value={stats.capacidadTotal.toLocaleString()}
        icon={BarChart3}
        color="blue"
        disabled
      />
    </div>
  );
}