'use client';

import StatCard from '@/components/admin/common/StatCard';
import type { TesoreriaPagosStats } from '@/lib/schemas/tesoreria-pagos';
import type { EstadoTesoreriaFiltro } from '@/lib/constants/tesoreria-pagos';
import { CheckCircle2, Clock, DollarSign, XCircle } from 'lucide-react';

interface Props {
  stats: TesoreriaPagosStats;
  estadoFilter: EstadoTesoreriaFiltro;
  onFilterChange: (estado: EstadoTesoreriaFiltro) => void;
}

function formatMontoCompacto(monto: number): string {
  if (monto >= 1_000_000) {
    const val = monto / 1_000_000;
    return `S/ ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (monto >= 1_000) {
    const val = monto / 1_000;
    return `S/ ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TesoreriaPagosStats({ stats, estadoFilter, onFilterChange }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Registros"
        value={stats.total}
        icon={DollarSign}
        color="slate"
        isActive={estadoFilter === 'todos'}
        onClick={() => onFilterChange('todos')}
      />
      <StatCard
        title="Exitosos"
        value={stats.exitosos}
        icon={CheckCircle2}
        color="emerald"
        isActive={estadoFilter === 'exitoso'}
        onClick={() => onFilterChange('exitoso')}
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
        title="Monto exitoso"
        value={formatMontoCompacto(stats.monto_exitoso)}
        icon={stats.fallidos > 0 ? XCircle : DollarSign}
        color="blue"
        disabled
      />
    </div>
  );
}