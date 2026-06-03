'use client';

import { Truck, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface DespachosStatsProps {
  stats: { total: number; preparando: number; transito: number; entregados: number };
  filtroEstado: string;
  onFiltroChange: (filtro: string) => void;
}

export function DespachosStats({ stats, filtroEstado, onFiltroChange }: DespachosStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard title="Total Envíos"  value={stats.total}      icon={Truck}        color="slate"   isActive={filtroEstado === 'todos'}      onClick={() => onFiltroChange('todos')}      />
      <StatCard title="Preparando"    value={stats.preparando} icon={Clock}        color="orange"  isActive={filtroEstado === 'preparando'} onClick={() => onFiltroChange('preparando')} />
      <StatCard title="En Ruta"       value={stats.transito}   icon={MapPin}       color="blue"    isActive={filtroEstado === 'en_ruta'}    onClick={() => onFiltroChange('en_ruta')}    />
      <StatCard title="Entregados"    value={stats.entregados} icon={CheckCircle2} color="emerald" isActive={filtroEstado === 'entregado'}  onClick={() => onFiltroChange('entregado')}  />
    </div>
  );
}