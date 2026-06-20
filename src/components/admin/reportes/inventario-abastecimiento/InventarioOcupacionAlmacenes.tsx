'use client';

import type { ReporteInventarioOcupacionAlmacen } from '@/lib/schemas/reporte-inventario-abastecimiento';
import { cn } from '@/lib/utils';
import { Warehouse } from 'lucide-react';

interface Props {
  almacenes: ReporteInventarioOcupacionAlmacen[];
  loading?: boolean;
}

function barColor(porcentaje: number): string {
  if (porcentaje >= 90) return 'bg-red-500';
  if (porcentaje >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function InventarioOcupacionAlmacenes({ almacenes, loading }: Props) {
  if (loading) {
    return <div className="bg-white border border-slate-200 rounded-3xl p-6 h-72 animate-pulse" />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Warehouse className="w-5 h-5 text-indigo-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ocupación por Almacén</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Stock actual vs. capacidad máxima configurada
          </p>
        </div>
      </div>

      {almacenes.length === 0 ? (
        <p className="text-sm text-slate-500 italic text-center py-8">
          No hay almacenes activos para mostrar
        </p>
      ) : (
        <div className="space-y-5">
          {almacenes.map((almacen) => (
            <div key={almacen.almacen_id} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-bold text-slate-900">{almacen.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {almacen.ocupacion_actual.toLocaleString('es-PE')} /{' '}
                    {almacen.capacidad_maxima.toLocaleString('es-PE')} {almacen.unidad}
                  </p>
                </div>
                <span className="font-black text-slate-800 tabular-nums">
                  {almacen.porcentaje_ocupacion.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn('h-full transition-all rounded-full', barColor(almacen.porcentaje_ocupacion))}
                  style={{ width: `${Math.min(100, almacen.porcentaje_ocupacion)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
