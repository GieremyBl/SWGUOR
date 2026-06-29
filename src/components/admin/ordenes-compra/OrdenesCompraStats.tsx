'use client';

import React from 'react';
import { Package, Clock, CheckCircle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stats {
  total: number;
  pendientes: number;
  confirmadas: number;
  montoTotal: number;
}

interface OrdenesCompraStatsProps {
  stats: Stats;
}

/**
 * Formatea números grandes a formato simplificado
 * 1000 → 1K
 * 1500000 → 1.5M
 */
function formatMontoSimplificado(monto: number): string {
  if (monto >= 1_000_000_000) {
    return `S/ ${(monto / 1_000_000_000).toFixed(1)}B`;
  }
  if (monto >= 1_000_000) {
    return `S/ ${(monto / 1_000_000).toFixed(1)}M`;
  }
  if (monto >= 1_000) {
    return `S/ ${(monto / 1_000).toFixed(1)}K`;
  }
  return `S/ ${monto.toLocaleString('es-PE')}`;
}

// Estilos de colores adaptados para la interfaz vertical
const colorStyles = {
  pink: {
    active: 'border-pink-500 ring-pink-50 bg-pink-50/30 shadow-pink-100/50',
    iconActive: 'bg-pink-600 text-white',
    iconIdle: 'bg-rose-50 text-pink-600 border border-rose-100/50',
    textActive: 'text-pink-600',
  },
  orange: {
    active: 'border-orange-500 ring-orange-50 bg-orange-50/30 shadow-orange-100/50',
    iconActive: 'bg-orange-600 text-white',
    iconIdle: 'bg-orange-50 text-orange-600 border border-orange-100/50',
    textActive: 'text-orange-600',
  },
  emerald: {
    active: 'border-emerald-500 ring-emerald-50 bg-emerald-50/30 shadow-emerald-100/50',
    iconActive: 'bg-emerald-600 text-white',
    iconIdle: 'bg-emerald-50 text-emerald-600 border border-emerald-100/50',
    textActive: 'text-emerald-600',
  },
  slate: {
    active: 'border-slate-500 ring-slate-50 bg-slate-50/30 shadow-slate-100/50',
    iconActive: 'bg-slate-700 text-white',
    iconIdle: 'bg-slate-50 text-slate-500 border border-slate-100',
    textActive: 'text-slate-700',
  },
  indigo: {
    active: 'border-indigo-500 ring-indigo-50 bg-indigo-50/30 shadow-indigo-100/50',
    iconActive: 'bg-indigo-600 text-white',
    iconIdle: 'bg-indigo-50 text-indigo-600 border border-indigo-100/40',
    textActive: 'text-indigo-600',
  },
};

interface LocalStatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'pink' | 'orange' | 'emerald' | 'slate' | 'indigo';
  isActive?: boolean;
}

/**
 * Componente local especializado de tarjeta vertical
 * Sigue el estándar visual estricto del Dashboard Administrador de GUOR
 */
function LocalStatCard({ title, value, icon: Icon, color, isActive = false }: LocalStatCardProps) {
  const s = colorStyles[color] ?? colorStyles.slate;

  // Renderiza el valor separando el símbolo 'S/' para un tamaño más premium
  const renderValue = () => {
    const valStr = String(value);
    if (valStr.startsWith('S/')) {
      const numberPart = valStr.replace('S/', '').trim();
      return (
        <span className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-slate-400">S/</span>
          <span className={cn(
            "text-2xl sm:text-3xl font-black tracking-tight transition-colors duration-300",
            isActive ? s.textActive : "text-slate-800"
          )}>
            {numberPart}
          </span>
        </span>
      );
    }

    return (
      <span className={cn(
        "text-2xl sm:text-3xl font-black tracking-tight transition-colors duration-300",
        isActive ? s.textActive : "text-slate-800"
      )}>
        {value}
      </span>
    );
  };

  return (
    <div
      className={cn(
        // Layout de contenedor vertical idéntico al diseño del dashboard
        "group p-6 rounded-2xl border bg-white flex flex-col justify-between min-h-[135px] w-full",
        "transition-all duration-300 select-none shadow-[0_4px_20px_-4px_rgba(148,163,184,0.03)]",
        isActive
          ? cn("border-2 scale-[1.01] z-10 shadow-md", s.active)
          : "border-slate-100/80 hover:border-slate-200/80 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between w-full">
        {/* Título y Valor numérico */}
        <div className="space-y-2 text-left overflow-hidden pr-2">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="pt-1">
            {renderValue()}
          </div>
        </div>

        {/* Caja de Icono */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm",
            isActive ? s.iconActive : s.iconIdle
          )}
        >
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
}

export function OrdenesCompraStats({ stats }: OrdenesCompraStatsProps) {
  const montoFormateado = formatMontoSimplificado(stats.montoTotal);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
      {/* 1. Total OC (Color Pink - Activo) */}
      <LocalStatCard
        title="Total OC"
        value={stats.total}
        icon={Package}
        color="pink"
        isActive={true}
      />

      {/* 2. Pendientes (Color Orange - Activo condicional) */}
      <LocalStatCard
        title="Pendientes"
        value={stats.pendientes}
        icon={Clock}
        color="orange"
        isActive={stats.pendientes > 0}
      />

      {/* 3. Confirmadas (Color Emerald - Activo condicional) */}
      <LocalStatCard
        title="Confirmadas"
        value={stats.confirmadas}
        icon={CheckCircle}
        color="emerald"
        isActive={stats.confirmadas > 0}
      />

      {/* 4. Monto Activo (Color Indigo / Slate para monedas) */}
      <LocalStatCard
        title="Monto Activo"
        value={montoFormateado}
        icon={Wallet}
        color="indigo"
        isActive={false}
      />
    </div>
  );
}