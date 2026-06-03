'use client';

import { useState } from 'react';

import IncidenciasFilters from './IncidenciasFilters';
import IncidenciasStats from './IncidenciasStats';
import IncidenciasSeverityChart from './IncidenciasSeverityChart';
import IncidenciasTable from './IncidenciasTable';

import {
  useReporteIncidencias,
} from '@/lib/hooks/useReporteIncidencias';

interface IncidenciasFiltersState {
  severidad: string;
  tipo: string;
}

export default function ReporteIncidenciasPage() {

  const [filters, setFilters] =
    useState<IncidenciasFiltersState>({
      severidad: '',
      tipo: '',
    });

  const [appliedFilters, setAppliedFilters] =
    useState<IncidenciasFiltersState>({
      severidad: '',
      tipo: '',
    });

  const {
    data,
    loading,
  } = useReporteIncidencias(
    appliedFilters,
  );

  const handleFilter = () => {
    setAppliedFilters(filters);
  };

  const handleClear = () => {

    const emptyFilters = {
      severidad: '',
      tipo: '',
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  if (!data && loading) {

    return (
      <div className="p-10">
        Cargando reporte...
      </div>
    );
  }

  return (

    <div className="p-6 bg-[#fff4e2] min-h-screen">

      {/* HEADER */}
      <div className="bg-[#fbddd3] rounded-3xl p-8 mb-6 border border-[#e4c28a]">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-[#b5854b] uppercase tracking-[0.2em] text-sm font-semibold">
              GUOR · REPORTES
            </p>

            <h1 className="text-5xl font-black text-[#231e1d] mt-2">
              Reporte de Incidencias
            </h1>

            <p className="text-[#6b5b52] mt-3 text-lg">
              Monitoreo mensual y anual de incidencias en talleres externos.
            </p>

          </div>

        </div>

      </div>

      {/* FILTROS */}
      <IncidenciasFilters
        filters={filters}
        onChange={setFilters}
        onFilter={handleFilter}
        onClear={handleClear}
      />

      {/* KPIs */}
      <div className="mt-6">

        <IncidenciasStats
          stats={data?.stats}
        />

      </div>

      {/* SEVERIDAD */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">

        {/* GRÁFICO CIRCULAR */}
        <div className="xl:col-span-2">

          <IncidenciasSeverityChart
            resumen={data?.resumen}
          />

        </div>

        {/* TARJETAS */}
        <div className="bg-[#fbddd3] border border-[#e4c28a] rounded-3xl p-6">

          <h2 className="text-2xl font-bold text-[#231e1d] mb-6">
            Resumen de Severidad
          </h2>

          <div className="space-y-4">

            <div className="bg-white rounded-2xl p-4 flex items-center justify-between">

              <span className="font-semibold text-green-600">
                Baja
              </span>

              <span className="text-2xl font-black text-[#231e1d]">
                {data?.resumen?.baja || 0}
              </span>

            </div>

            <div className="bg-white rounded-2xl p-4 flex items-center justify-between">

              <span className="font-semibold text-yellow-500">
                Media
              </span>

              <span className="text-2xl font-black text-[#231e1d]">
                {data?.resumen?.media || 0}
              </span>

            </div>

            <div className="bg-white rounded-2xl p-4 flex items-center justify-between">

              <span className="font-semibold text-orange-500">
                Alta
              </span>

              <span className="text-2xl font-black text-[#231e1d]">
                {data?.resumen?.alta || 0}
              </span>

            </div>

            <div className="bg-white rounded-2xl p-4 flex items-center justify-between">

              <span className="font-semibold text-red-500">
                Crítica
              </span>

              <span className="text-2xl font-black text-[#231e1d]">
                {data?.resumen?.critica || 0}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* TABLA */}
      <div className="mt-6">

        <IncidenciasTable
          data={data?.data || []}
        />

      </div>

    </div>
  );
}