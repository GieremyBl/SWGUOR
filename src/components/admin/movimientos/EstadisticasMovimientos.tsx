'use client';

import React from 'react';
import {
  ArrowUp, ArrowDown, RotateCcw, Activity,
  FlaskConical, Undo2, Wrench, TrendingUp,
} from 'lucide-react';

export interface EstadisticasMovimientosType {
  totalEntradas: number;
  totalSalidas: number;
  totalAjustes: number;
  totalMovimientos: number;
  montoTotalEntradas?: number;
  montoTotalSalidas?: number;
  // Tipos extendidos del enum (porTipo del servicio)
  porTipo?: Record<string, number>;
}

interface EstadisticasMovimientosProps {
  estadisticas: EstadisticasMovimientosType;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  valueColor: string;
}

function MiniStatCard({ title, value, icon: Icon, bgColor, iconColor, valueColor }: StatCardProps) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${bgColor} transition-all`}>
      <div className={`p-2 rounded-lg ${iconColor} bg-white/60`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-current opacity-60">{title}</p>
        <p className={`text-xl font-black ${valueColor}`}>{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

export function EstadisticasMovimientos({ estadisticas, isLoading }: EstadisticasMovimientosProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const p = estadisticas.porTipo ?? {};

  // Calcular tipos especiales (con fallback a 0)
  const consumos = (p['consumo_orden_produccion'] ?? 0) + (p['consumo_orden_produccion_item'] ?? 0);
  const devoluciones = (p['devolucion_consumo'] ?? 0) + (p['devolucion_a_proveedor'] ?? 0) +
    (p['recepcion_devolucion_proveedor'] ?? 0) + (p['devolucion_a_cliente'] ?? 0) + (p['recepcion_devolucion_cliente'] ?? 0);
  const prodEntradas = p['produccion_entrada'] ?? 0;
  const incidencias = p['incidencia_taller'] ?? 0;

  return (
    <div className="space-y-3">
      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStatCard
          title="Entradas"
          value={estadisticas.totalEntradas}
          icon={ArrowUp}
          bgColor="bg-emerald-50 border-emerald-100 text-emerald-800"
          iconColor="text-emerald-600"
          valueColor="text-emerald-700"
        />
        <MiniStatCard
          title="Salidas"
          value={estadisticas.totalSalidas}
          icon={ArrowDown}
          bgColor="bg-orange-50 border-orange-100 text-orange-800"
          iconColor="text-orange-600"
          valueColor="text-orange-700"
        />
        <MiniStatCard
          title="Ajustes"
          value={estadisticas.totalAjustes}
          icon={RotateCcw}
          bgColor="bg-blue-50 border-blue-100 text-blue-800"
          iconColor="text-blue-600"
          valueColor="text-blue-700"
        />
        <MiniStatCard
          title="Total Global"
          value={estadisticas.totalMovimientos}
          icon={TrendingUp}
          bgColor="bg-slate-50 border-slate-200 text-slate-800"
          iconColor="text-slate-500"
          valueColor="text-slate-700"
        />
      </div>

      {/* Tarjetas secundarias — tipos extendidos */}
      {estadisticas.totalMovimientos > 0 && (consumos + devoluciones + prodEntradas + incidencias) > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStatCard
            title="Consumos O/P"
            value={consumos}
            icon={FlaskConical}
            bgColor="bg-violet-50 border-violet-100 text-violet-800"
            iconColor="text-violet-600"
            valueColor="text-violet-700"
          />
          <MiniStatCard
            title="Devoluciones"
            value={devoluciones}
            icon={Undo2}
            bgColor="bg-amber-50 border-amber-100 text-amber-800"
            iconColor="text-amber-600"
            valueColor="text-amber-700"
          />
          <MiniStatCard
            title="Prod. Entradas"
            value={prodEntradas}
            icon={Activity}
            bgColor="bg-teal-50 border-teal-100 text-teal-800"
            iconColor="text-teal-600"
            valueColor="text-teal-700"
          />
          <MiniStatCard
            title="Incidencias"
            value={incidencias}
            icon={Wrench}
            bgColor="bg-red-50 border-red-100 text-red-800"
            iconColor="text-red-600"
            valueColor="text-red-700"
          />
        </div>
      )}
    </div>
  );
}
