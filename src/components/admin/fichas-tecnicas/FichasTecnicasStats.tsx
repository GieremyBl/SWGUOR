'use client';

import { Layers, CheckCircle2, PenLine, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface FichasTecnicasStatsProps {
  stats: { total: number; activas: number; borradores: number; revision: number };
  statusFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export function FichasTecnicasStats({ stats, statusFilter, onFilterChange }: FichasTecnicasStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Fichas"
        value={stats.total}
        icon={Layers}
        color="pink"
        isActive={statusFilter === null}
        onClick={() => onFilterChange(null)}
      />
      <StatCard
        title="En Línea / Activas"
        value={stats.activas}
        icon={CheckCircle2}
        color="emerald"
        isActive={statusFilter === 'activo'}
        onClick={() => onFilterChange(statusFilter === 'activo' ? null : 'activo')}
      />
      <StatCard
        title="Borradores"
        value={stats.borradores}
        icon={PenLine}
        color="slate"
        isActive={statusFilter === 'borrador'}
        onClick={() => onFilterChange(statusFilter === 'borrador' ? null : 'borrador')}
      />
      <StatCard
        title="En Revisión"
        value={stats.revision}
        icon={AlertTriangle}
        color="orange"
        isActive={statusFilter === 'revision'}
        onClick={() => onFilterChange(statusFilter === 'revision' ? null : 'revision')}
      />
    </div>
  );
}