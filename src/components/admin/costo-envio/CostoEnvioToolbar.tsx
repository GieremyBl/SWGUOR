'use client';

import { Search } from 'lucide-react';

export interface CostoEnvioFiltros {
  busqueda: string;
  activo: string;
}

interface Props {
  filtros: CostoEnvioFiltros;
  onChange: (filtros: CostoEnvioFiltros) => void;
}

export function CostoEnvioToolbar({ filtros, onChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          placeholder="Buscar por zona o ID..."
          value={filtros.busqueda}
          onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        />
      </div>
      <select
        value={filtros.activo}
        onChange={(e) => onChange({ ...filtros, activo: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
      >
        <option value="todos">Todas</option>
        <option value="true">Activas</option>
        <option value="false">Inactivas</option>
      </select>
    </div>
  );
}
