'use client';

import { Badge } from '@/components/ui/badge';
import type { ManufacturaCuelloBotella } from '@/lib/schemas/reporte-eficiencia-manufactura';
import { formatDuracion } from '@/lib/helpers/eficiencia-manufactura.helper';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface Props {
  cuellos: ManufacturaCuelloBotella[];
  loading?: boolean;
}

export function ManufacturaCuellosBotella({ cuellos, loading }: Props) {
  if (loading) {
    return <div className="bg-white border border-amber-200 rounded-3xl p-6 h-full min-h-[320px] animate-pulse" />;
  }

  return (
    <div className="bg-white border border-amber-200 rounded-3xl p-6 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cuellos de Botella</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Etapas que superan el tiempo estimado según histórico de seguimiento
          </p>
        </div>
      </div>

      {cuellos.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-8 text-center">
          No se detectaron etapas con retraso significativo en este momento
        </p>
      ) : (
        <div className="space-y-4">
          {cuellos.map((cuello, index) => {
            const ratio = Math.min(
              100,
              (cuello.tiempo_actual_promedio_min / Math.max(cuello.tiempo_estimado_min, 1)) * 100,
            );

            return (
              <div
                key={cuello.etapa}
                className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-700">#{index + 1}</span>
                      <p className="font-bold text-slate-900">{cuello.label}</p>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {cuello.ordenes_activas} OP activas · Estimado{' '}
                      {formatDuracion(cuello.tiempo_estimado_min)} · Actual{' '}
                      {formatDuracion(cuello.tiempo_actual_promedio_min)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold uppercase border-red-200 text-red-700 shrink-0"
                  >
                    +{formatDuracion(cuello.exceso_minutos)}
                  </Badge>
                </div>
                <div className="h-2 rounded-full bg-white overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      ratio >= 150 ? 'bg-red-500' : ratio >= 120 ? 'bg-amber-500' : 'bg-orange-400',
                    )}
                    style={{ width: `${Math.min(100, ratio)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
