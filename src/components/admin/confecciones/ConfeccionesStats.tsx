'use client';

import { Scissors, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface ConfeccionesStatsProps {
  stats: { total: number; activas: number; urgentes: number; completadas: number };
  statusFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export default function ConfeccionesStats({ stats, statusFilter, onFilterChange }: ConfeccionesStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        title="Total Órdenes"
        value={stats.total}
        icon={Scissors}
        color="pink"
        isActive={statusFilter === null}
        onClick={() => onFilterChange(null)}
      />
      <StatCard
        title="En Producción"
        value={stats.activas}
        icon={Zap}
        color="blue"
        isActive={statusFilter === 'activas'}
        onClick={() => onFilterChange('activas')}
      />
      <StatCard
        title="Urgentes"
        value={stats.urgentes}
        icon={AlertTriangle}
        color="orange"
        isActive={statusFilter === 'urgentes'}
        onClick={() => onFilterChange('urgentes')}
      />
      <StatCard
        title="Completadas"
        value={stats.completadas}
        icon={CheckCircle2}
        color="emerald"
        isActive={statusFilter === 'completadas'}
        onClick={() => onFilterChange('completadas')}
      />
    </div>
  );
}