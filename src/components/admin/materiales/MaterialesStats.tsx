'use client';

import { Layers, AlertTriangle, ShoppingCart } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';

interface MaterialesStatsProps {
  stats: {
    total: number;
    bajoStock: number;
    sinStock: number;
    conOrdenes: number;
  };
}

export function MaterialesStats({ stats }: MaterialesStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard title="Total materiales" value={stats.total} icon={Layers} color="slate" />
      <StatCard title="Bajo stock" value={stats.bajoStock} icon={AlertTriangle} color="orange" />
      <StatCard title="Sin stock" value={stats.sinStock} icon={Layers} color="pink" />
      <StatCard title="En órdenes de compra" value={stats.conOrdenes} icon={ShoppingCart} color="blue" />
    </div>
  );
}
