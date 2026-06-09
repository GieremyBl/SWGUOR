'use client';

import { Package, AlertTriangle, ShoppingCart, DollarSign } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface InsumosStatsProps {
  stats: {
    total: number;
    bajoStock: number;
    sinStock: number;
    conOrdenes: number;
  };
}

export function InsumosStats({ stats }: InsumosStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard title="Total insumos" value={stats.total} icon={Package} color="slate" />
      <StatCard title="Bajo stock" value={stats.bajoStock} icon={AlertTriangle} color="orange" />
      <StatCard title="Sin stock" value={stats.sinStock} icon={Package} color="pink" />
      <StatCard title="En órdenes de compra" value={stats.conOrdenes} icon={ShoppingCart} color="blue" />
    </div>
  );
}
