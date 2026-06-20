'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MONEDA_ANALITICA_OPCIONES, type MonedaAnaliticaFiltro } from '@/lib/constants/analitica-financiera';

interface Props {
  moneda: MonedaAnaliticaFiltro;
  loading: boolean;
  onMonedaChange: (moneda: MonedaAnaliticaFiltro) => void;
  onRefresh: () => void;
}

export function AnaliticaFinancieraFilters({
  moneda,
  loading,
  onMonedaChange,
  onRefresh,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white border border-[#e4c28a] rounded-2xl p-4 shadow-sm">
      <select
        value={moneda}
        onChange={(e) => onMonedaChange(e.target.value as MonedaAnaliticaFiltro)}
        className="h-11 rounded-xl border border-[#e4c28a] bg-[#fff4e2]/40 px-3 text-sm font-medium text-[#231e1d] flex-1"
        aria-label="Filtrar por moneda"
      >
        {MONEDA_ANALITICA_OPCIONES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={loading}
        className="h-11 rounded-xl border-[#e4c28a] text-[#6b5b52] shrink-0"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Actualizar
      </Button>
    </div>
  );
}
