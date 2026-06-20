'use client';

import { Layers, CheckCircle2, PenLine, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface FichasTecnicasStatsProps {
  stats: { total: number; aprobadas: number; borradores: number; enRevision: number };
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
        title="Aprobadas"
        value={stats.aprobadas}
        icon={CheckCircle2}
        color="emerald"
        isActive={statusFilter === 'aprobada'}
        onClick={() => onFilterChange(statusFilter === 'aprobada' ? null : 'aprobada')}
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
        value={stats.enRevision}
        icon={AlertTriangle}
        color="orange"
        isActive={statusFilter === 'en_revision'}
        onClick={() => onFilterChange(statusFilter === 'en_revision' ? null : 'en_revision')}
      />
    </div>
  );
}