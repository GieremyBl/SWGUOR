'use client';

import { Archive, Package, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/admin/common/StatCard';
import { useState } from 'react';

interface ReservasStatsCardsProps {
    totalReservas: number;
    totalUnidades: number;
    totalVencidas: number;
    unidadesFormatted: string;
}

export default function ReservasStatsCards({
    totalReservas,
    totalUnidades,
    totalVencidas,
    unidadesFormatted,
}: ReservasStatsCardsProps) {
    const [activeFilter, setActiveFilter] = useState<'all' | 'unidades' | 'vencidas'>('all');

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                title="Reservas activas"
                value={totalReservas}
                icon={Archive}
                color="slate"
                isActive={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
            />
            <StatCard
                title="Unidades apartadas"
                value={unidadesFormatted}
                icon={Package}
                color="blue"
                isActive={activeFilter === 'unidades'}
                onClick={() => setActiveFilter('unidades')}
            />
            <StatCard
                title="Expiradas (aún activas en BD)"
                value={totalVencidas}
                icon={AlertTriangle}
                color="amber"
                isActive={activeFilter === 'vencidas'}
                onClick={() => setActiveFilter('vencidas')}
            />
        </div>
    );
}