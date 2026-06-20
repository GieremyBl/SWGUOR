'use client';

import { Search } from 'lucide-react';
import {
  SEVERIDADES_INCIDENCIA_TALLER,
  SEVERIDAD_INCIDENCIA_LABELS,
} from '@/lib/constants/incidencias-taller';

export interface IncidenciasTallerFiltros {
  busqueda: string;
  severidad: string;
  resuelto: string;
}

interface Props {
  filtros: IncidenciasTallerFiltros;
  onChange: (filtros: IncidenciasTallerFiltros) => void;
}

export function IncidenciasTallerToolbar({ filtros, onChange }: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          placeholder="Buscar por descripción, solución o taller..."
          value={filtros.busqueda}
          onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>
      <select
        value={filtros.severidad}
        onChange={(e) => onChange({ ...filtros, severidad: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        <option value="todas">Todas las severidades</option>
        {SEVERIDADES_INCIDENCIA_TALLER.map((severidad) => (
          <option key={severidad} value={severidad}>
            {SEVERIDAD_INCIDENCIA_LABELS[severidad]}
          </option>
        ))}
      </select>
      <select
        value={filtros.resuelto}
        onChange={(e) => onChange({ ...filtros, resuelto: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        <option value="todos">Todos los estados</option>
        <option value="false">Pendientes</option>
        <option value="true">Resueltas</option>
      </select>
    </div>
  );
}
