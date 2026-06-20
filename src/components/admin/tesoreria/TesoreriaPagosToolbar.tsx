'use client';

import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ESTADOS_TESORERIA_LABELS,
  METODOS_PAGO_TESORERIA,
  type EstadoTesoreriaFiltro,
} from '@/lib/constants/tesoreria-pagos';
import {
  ULTIMOS_PAGOS_RANGO_LABELS,
  type UltimosPagosRangoPreset,
} from '@/lib/helpers/ultimos-pagos-date.helper';
import { cn } from '@/lib/utils';

export interface TesoreriaFiltrosState {
  busqueda: string;
  estado: EstadoTesoreriaFiltro;
  metodo_pago: string;
  fecha_desde: string;
  fecha_hasta: string;
}

interface Props {
  filtros: TesoreriaFiltrosState;
  loading: boolean;
  onChange: (patch: Partial<TesoreriaFiltrosState>) => void;
  onRefresh: () => void;
  rangoPreset?: UltimosPagosRangoPreset;
  onRangoPresetChange?: (preset: UltimosPagosRangoPreset) => void;
}

export function TesoreriaPagosToolbar({
  filtros,
  loading,
  onChange,
  onRefresh,
  rangoPreset,
  onRangoPresetChange,
}: Props) {
  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {onRangoPresetChange && rangoPreset && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ULTIMOS_PAGOS_RANGO_LABELS) as UltimosPagosRangoPreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onRangoPresetChange(key)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all',
                rangoPreset === key
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-200 hover:text-emerald-700',
              )}
            >
              {ULTIMOS_PAGOS_RANGO_LABELS[key]}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente, comprobante (F001-...) o N.° pedido..."
            value={filtros.busqueda}
            onChange={(e) => onChange({ busqueda: e.target.value })}
            className="pl-10 bg-white border-gray-200 rounded-xl h-11"
          />
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl h-11 px-4 border-gray-200 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <select
          value={filtros.estado}
          onChange={(e) => onChange({ estado: e.target.value as EstadoTesoreriaFiltro })}
          className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm"
        >
          {(Object.keys(ESTADOS_TESORERIA_LABELS) as EstadoTesoreriaFiltro[]).map((key) => (
            <option key={key} value={key}>
              Estado: {ESTADOS_TESORERIA_LABELS[key]}
            </option>
          ))}
        </select>

        <select
          value={filtros.metodo_pago}
          onChange={(e) => onChange({ metodo_pago: e.target.value })}
          className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm"
        >
          {METODOS_PAGO_TESORERIA.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <Input
          type="date"
          value={filtros.fecha_desde}
          onChange={(e) => onChange({ fecha_desde: e.target.value })}
          className="h-11 rounded-xl border-gray-200"
          aria-label="Fecha desde"
        />

        <Input
          type="date"
          value={filtros.fecha_hasta}
          onChange={(e) => onChange({ fecha_hasta: e.target.value })}
          className="h-11 rounded-xl border-gray-200"
          aria-label="Fecha hasta"
        />
      </div>
    </div>
  );
}
