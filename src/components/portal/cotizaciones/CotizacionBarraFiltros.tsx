'use client';

import { Search } from 'lucide-react';

export type EstadoFiltro =
  | 'todas' | 'borrador' | 'enviada'
  | 'aprobada' | 'rechazada' | 'expirada' | 'convertida';

const FILTROS: { value: EstadoFiltro; label: string }[] = [
  { value: 'todas',      label: 'Todas'      },
  { value: 'borrador',   label: 'Borradores' },
  { value: 'enviada',    label: 'En Revisión' },
  { value: 'aprobada',   label: 'Aceptadas'  },
  { value: 'convertida', label: 'En Orden'   },
];

interface Props {
  filtro: EstadoFiltro;
  setFiltro: (f: EstadoFiltro) => void;
  busqueda: string;
  setBusqueda: (v: string) => void;
}

export function CotizacionBarraFiltros({
  filtro,
  setFiltro,
  busqueda,
  setBusqueda,
}: Props) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border uppercase tracking-wider ${
              filtro === f.value
                ? 'bg-guor-dark text-white border-guor-dark shadow-sm'
                : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por N°..."
          className="h-11 w-full lg:w-72 border border-slate-200 rounded-xl pl-10 pr-4 text-sm focus:ring-4 focus:ring-amber-100 outline-none transition-all"
        />
      </div>
    </div>
  );
}
