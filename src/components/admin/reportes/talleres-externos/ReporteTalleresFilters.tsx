'use client';

import type {
  EstadoReporteTaller,
  ReporteTallerFilters,
} from '@/types/reporte-talleres';

interface Props {
  filters: ReporteTallerFilters;
  onChange: (filters: ReporteTallerFilters) => void;
  onFilter: () => void;
  onClear: () => void;
}

const estados: {
  label: string;
  value: EstadoReporteTaller | 'todos';
}[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Completado', value: 'completado' },
  { label: 'En Proceso', value: 'en_proceso' },
  { label: 'Retrasado', value: 'retrasado' },
  { label: 'Pendiente', value: 'pendiente' },
];

export default function ReporteTalleresFilters({
  filters,
  onChange,
  onFilter,
  onClear,
}: Props) {
  return (
    <div className="rounded-3xl border border-[#e4c28a]/20 bg-[#fbddd3] p-6 shadow-sm">

      <h3 className="mb-5 text-lg font-bold text-[#231e1d]">
        Filtros de Búsqueda
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        <input
          type="text"
          placeholder="Nombre del taller"
          value={filters.taller || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              taller: e.target.value,
            })
          }
          className="rounded-2xl border border-[#e4c28a]/30 bg-white px-4 py-3 outline-none transition focus:border-[#b5854b]"
        />

        <input
          type="date"
          value={filters.fechaInicio || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              fechaInicio: e.target.value,
            })
          }
          className="rounded-2xl border border-[#e4c28a]/30 bg-white px-4 py-3 outline-none transition focus:border-[#b5854b]"
        />

        <input
          type="date"
          value={filters.fechaFin || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              fechaFin: e.target.value,
            })
          }
          className="rounded-2xl border border-[#e4c28a]/30 bg-white px-4 py-3 outline-none transition focus:border-[#b5854b]"
        />

        <select
          value={filters.estado || 'todos'}
          onChange={(e) =>
            onChange({
              ...filters,
              estado: e.target.value as EstadoReporteTaller,
            })
          }
          className="rounded-2xl border border-[#e4c28a]/30 bg-white px-4 py-3 outline-none transition focus:border-[#b5854b]"
        >
          {estados.map((estado) => (
            <option
              key={estado.value}
              value={estado.value}
            >
              {estado.label}
            </option>
          ))}
        </select>

      </div>

      <div className="mt-6 flex flex-wrap gap-3">

        <button
          onClick={onFilter}
          className="rounded-2xl bg-[#b5854b] px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
        >
          Filtrar
        </button>

        <button
          onClick={onClear}
          className="rounded-2xl bg-[#231e1d] px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
        >
          Limpiar
        </button>

      </div>

    </div>
  );
}