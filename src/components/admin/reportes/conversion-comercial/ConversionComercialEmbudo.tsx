'use client';

import StatCard from '@/components/admin/common/StatCard';
import type { ConversionEmbudoEtapa } from '@/lib/schemas/reporte-conversion-comercial';
import { formatPorcentaje } from '@/lib/helpers/conversion-comercial.helper';
import { cn } from '@/lib/utils';
import { CheckCircle2, FileText, ShoppingCart, TrendingUp } from 'lucide-react';

interface Props {
  embudo: ConversionEmbudoEtapa[];
  tasaGlobal: number;
}

const ICONS = [FileText, CheckCircle2, ShoppingCart];

export function ConversionComercialEmbudo({ embudo, tasaGlobal }: Props) {
  const maxTotal = Math.max(...embudo.map((e) => e.total), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {embudo.map((etapa, index) => (
          <StatCard
            key={etapa.key}
            title={etapa.label}
            value={etapa.total}
            icon={ICONS[index] ?? TrendingUp}
            color={index === 0 ? 'indigo' : index === 1 ? 'emerald' : 'pink'}
            disabled
          />
        ))}
      </div>

      <div className="bg-white border border-[#e4c28a] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-[#231e1d]">Embudo de Ventas</h2>
            <p className="text-sm text-[#6b5b52] mt-0.5">
              De cotización creada → aprobada → pedido confirmado
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-emerald-700">{formatPorcentaje(tasaGlobal)}</p>
            <p className="text-[10px] uppercase font-bold text-[#b5854b] tracking-wider">
              Tasa global de cierre
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {embudo.map((etapa, index) => {
            const widthPct = (etapa.total / maxTotal) * 100;
            return (
              <div key={etapa.key} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-[#231e1d]">{etapa.label}</span>
                  <span className="text-[#6b5b52] tabular-nums">
                    {etapa.total} · {formatPorcentaje(etapa.porcentaje)}
                  </span>
                </div>
                <div className="h-8 rounded-xl bg-[#fff4e2] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-xl flex items-center justify-end pr-3 text-xs font-bold text-white transition-all',
                      index === 0 && 'bg-indigo-500',
                      index === 1 && 'bg-emerald-500',
                      index === 2 && 'bg-pink-500',
                    )}
                    style={{ width: `${Math.max(widthPct, etapa.total > 0 ? 8 : 0)}%` }}
                  >
                    {etapa.total > 0 ? etapa.total : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
