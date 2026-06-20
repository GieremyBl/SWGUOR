'use client';

import { Search } from 'lucide-react';
import { ESTADOS_INCIDENCIA_CLIENTE, ESTADO_INCIDENCIA_LABELS } from '@/lib/constants/incidencias-cliente';

export interface IncidenciasClienteFiltros {
  busqueda: string;
  estado: string;
}

interface Props {
  filtros: IncidenciasClienteFiltros;
  onChange: (filtros: IncidenciasClienteFiltros) => void;
}

export function IncidenciasClienteToolbar({ filtros, onChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          placeholder="Buscar por cliente, pedido o descripción..."
          value={filtros.busqueda}
          onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>
      <select
        value={filtros.estado}
        onChange={(e) => onChange({ ...filtros, estado: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        <option value="todos">Todos los estados</option>
        {ESTADOS_INCIDENCIA_CLIENTE.map((estado) => (
          <option key={estado} value={estado}>
            {ESTADO_INCIDENCIA_LABELS[estado]}
          </option>
        ))}
      </select>
    </div>
  );
}
