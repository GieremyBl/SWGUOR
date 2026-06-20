'use client';

import { Search } from 'lucide-react';
import {
  ESTADO_DEVOLUCION_PROV_LABELS,
} from '@/lib/constants/devoluciones-proveedor';
import type { EstadoDevolucionProv } from '@prisma/client';

export interface DevolucionesProveedorFiltros {
  busqueda: string;
  estado: string;
}

interface Props {
  filtros: DevolucionesProveedorFiltros;
  onChange: (filtros: DevolucionesProveedorFiltros) => void;
}

const ESTADOS = Object.keys(ESTADO_DEVOLUCION_PROV_LABELS) as EstadoDevolucionProv[];

export function DevolucionesProveedorToolbar({ filtros, onChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          placeholder="Buscar por proveedor, insumo, material o motivo..."
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
        {ESTADOS.map((estado) => (
          <option key={estado} value={estado}>
            {ESTADO_DEVOLUCION_PROV_LABELS[estado]}
          </option>
        ))}
      </select>
    </div>
  );
}
