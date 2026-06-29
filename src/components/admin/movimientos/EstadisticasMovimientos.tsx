'use client';

import React from 'react';
import { FlaskConical, Undo2, Activity, Wrench } from 'lucide-react';

export interface EstadisticasMovimientosType {
  totalEntradas: number;
  totalSalidas: number;
  totalAjustes: number;
  totalMovimientos: number;
  montoTotalEntradas?: number;
  montoTotalSalidas?: number;
  porTipo?: Record<string, number>;
}

interface EstadisticasMovimientosProps {
  estadisticas: EstadisticasMovimientosType;
  isLoading?: boolean;
}

interface MiniStatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  valueColor: string;
}

function MiniStatCard({ title, value, icon: Icon, bgColor, iconColor, valueColor }: MiniStatCardProps) {
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

/**
 * Solo renderiza la fila secundaria de tipos extendidos (consumos, devoluciones,
 * producción, incidencias). Las stats principales (entradas/salidas/ajustes/total)
 * las maneja el page con StatCard común para coherencia visual.
 */
export function EstadisticasMovimientos({ estadisticas, isLoading }: EstadisticasMovimientosProps) {
  const p = estadisticas.porTipo ?? {};

  const consumos = (p['consumo_orden_produccion'] ?? 0) + (p['consumo_orden_produccion_item'] ?? 0);
  const devoluciones = (p['devolucion_consumo'] ?? 0) + (p['devolucion_a_proveedor'] ?? 0) +
    (p['recepcion_devolucion_proveedor'] ?? 0) + (p['devolucion_a_cliente'] ?? 0) +
    (p['recepcion_devolucion_cliente'] ?? 0);
  const prodEntradas = p['produccion_entrada'] ?? 0;
  const incidencias = p['incidencia_taller'] ?? 0;

  const tieneSecundarias = (consumos + devoluciones + prodEntradas + incidencias) > 0;

  // Skeleton solo para la fila secundaria
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!tieneSecundarias) return null;

  return (
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
  );
}