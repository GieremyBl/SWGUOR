'use client';

import { Filter } from 'lucide-react';

interface IncidenciasFiltersState {
  severidad: string;
  tipo: string;
}

interface Props {
  filters: IncidenciasFiltersState;

  onChange: (
    filters: IncidenciasFiltersState,
  ) => void;

  onFilter: () => void;

  onClear: () => void;
}

export default function IncidenciasFilters({
  filters,
  onChange,
  onFilter,
  onClear,
}: Props) {

  return (
    <div className="bg-[#fbddd3] border border-[#e4c28a] rounded-3xl p-6">

      <div className="flex items-center gap-2 mb-6">

        <Filter
          className="text-[#b5854b]"
          size={20}
        />

        <h2 className="text-2xl font-bold text-[#231e1d]">
          Filtros de Búsqueda
        </h2>

      </div>

      <div className="flex flex-wrap items-center gap-4">

        {/* SEVERIDAD */}
        <select
          value={filters.severidad}
          onChange={(e) =>
            onChange({
              ...filters,
              severidad:
                e.target.value,
            })
          }
          className="
            h-14
            min-w-[260px]
            rounded-2xl
            border
            border-[#e4c28a]
            bg-white
            px-4
            text-[#231e1d]
            outline-none
          "
        >
          <option value="">
            Todas las severidades
          </option>

          <option value="baja">
            Baja
          </option>

          <option value="media">
            Media
          </option>

          <option value="alta">
            Alta
          </option>

          <option value="critica">
            Crítica
          </option>

        </select>

        {/* TIPO */}
        <select
          value={filters.tipo}
          onChange={(e) =>
            onChange({
              ...filters,
              tipo:
                e.target.value,
            })
          }
          className="
            h-14
            min-w-[260px]
            rounded-2xl
            border
            border-[#e4c28a]
            bg-white
            px-4
            text-[#231e1d]
            outline-none
          "
        >
          <option value="">
            Todos los tipos
          </option>

          <option value="averia_maquina">
            Avería Máquina
          </option>

          <option value="falta_material">
            Falta Material
          </option>

          <option value="error_diseno">
            Error Diseño
          </option>

          <option value="defecto_corte">
            Defecto Corte
          </option>

          <option value="defecto_confeccion">
            Defecto Confección
          </option>

          <option value="retraso">
            Retraso
          </option>

        </select>

        {/* BOTÓN FILTRAR */}
        <button
          onClick={onFilter}
          className="
            h-14
            rounded-2xl
            bg-[#b5854b]
            px-8
            text-sm
            font-semibold
            text-white
            transition
            hover:scale-[1.02]
          "
        >
          Filtrar
        </button>

        {/* BOTÓN LIMPIAR */}
        <button
          onClick={onClear}
          className="
            h-14
            rounded-2xl
            bg-[#231e1d]
            px-8
            text-sm
            font-semibold
            text-white
            transition
            hover:scale-[1.02]
          "
        >
          Limpiar
        </button>

      </div>

    </div>
  );
}