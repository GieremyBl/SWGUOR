'use client';

import { useState } from 'react';

import {
  FileDown,
  FileSpreadsheet,
  Factory,
} from 'lucide-react';

import { useReporteTalleresExternos } from '@/lib/hooks/useReporteTalleresExternos';

import ReporteTalleresFilters from './ReporteTalleresFilters';
import ReporteTalleresStats from './ReporteTalleresStats';
import ReporteTalleresChart from './ReporteTalleresChart';
import ReporteTalleresTable from './ReporteTalleresTable';

import type {
  ReporteTallerFilters,
} from '@/types/reporte-talleres';

export default function ReporteTalleresExternos() {
  const [filters, setFilters] =
    useState<ReporteTallerFilters>({});

  const [appliedFilters, setAppliedFilters] =
    useState<ReporteTallerFilters>({});

  const { data, loading } =
    useReporteTalleresExternos(appliedFilters);

  const handleFilter = () => {
    setAppliedFilters(filters);
  };

  const handleClear = () => {
    const empty = {};

    setFilters(empty);
    setAppliedFilters(empty);
  };

  const handleExportPdf = () => {
    const params = new URLSearchParams();

    if (appliedFilters.taller) {
      params.append('taller', appliedFilters.taller);
    }

    if (appliedFilters.estado) {
      params.append('estado', appliedFilters.estado);
    }

    if (appliedFilters.fechaInicio) {
      params.append('fechaInicio', appliedFilters.fechaInicio);
    }

    if (appliedFilters.fechaFin) {
      params.append('fechaFin', appliedFilters.fechaFin);
    }

    params.append('export', 'pdf');

    window.open(
      `/api/admin/reportes/talleres-externos?${params.toString()}`,
      '_blank'
    );
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();

    if (appliedFilters.taller) {
      params.append('taller', appliedFilters.taller);
    }

    if (appliedFilters.estado) {
      params.append('estado', appliedFilters.estado);
    }

    if (appliedFilters.fechaInicio) {
      params.append('fechaInicio', appliedFilters.fechaInicio);
    }

    if (appliedFilters.fechaFin) {
      params.append('fechaFin', appliedFilters.fechaFin);
    }

    params.append('export', 'excel');

    window.open(
      `/api/admin/reportes/talleres-externos?${params.toString()}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-[#fff4e2] p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 rounded-3xl border border-[#e4c28a]/30 bg-[#fbddd3] p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="rounded-2xl bg-[#b5854b] p-3 text-white shadow-md">
              <Factory size={28} />
            </div>

            <div>

              <p className="text-sm font-medium uppercase tracking-widest text-[#b5854b]">
                GUOR · REPORTES
              </p>

              <h1 className="mt-1 text-3xl font-black text-[#231e1d]">
                Reporte de Avance de Talleres Externos
              </h1>

              <p className="mt-2 text-sm text-[#231e1d]/70">
                Monitoreo y seguimiento de producción en talleres externos.
              </p>

            </div>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 rounded-2xl bg-[#231e1d] px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
            >
              <FileDown size={18} />
              Descargar PDF
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-2xl bg-[#b5854b] px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
            >
              <FileSpreadsheet size={18} />
              Exportar Excel
            </button>

          </div>

        </div>

        {/* FILTROS */}
        <ReporteTalleresFilters
          filters={filters}
          onChange={setFilters}
          onFilter={handleFilter}
          onClear={handleClear}
        />

        {/* STATS */}
        {data && (
          <ReporteTalleresStats stats={data.stats} />
        )}

        {/* CONTENT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          <div className="lg:col-span-2">
            {data && (
              <ReporteTalleresChart resumen={data.resumen} />
            )}
          </div>

          <div className="rounded-3xl border border-[#e4c28a]/20 bg-[#fbddd3] p-6 shadow-sm">

            <h3 className="mb-6 text-lg font-bold text-[#231e1d]">
              Resumen de Estados
            </h3>

            {data && (
              <div className="space-y-4">

                <EstadoItem
                  label="Completado"
                  value={data.resumen.completado}
                  color="bg-green-500"
                />

                <EstadoItem
                  label="En Proceso"
                  value={data.resumen.enProceso}
                  color="bg-yellow-500"
                />

                <EstadoItem
                  label="Retrasado"
                  value={data.resumen.retrasado}
                  color="bg-red-500"
                />

                <EstadoItem
                  label="Pendiente"
                  value={data.resumen.pendiente}
                  color="bg-gray-400"
                />

                <div className="pt-6">

                  <div className="mb-2 flex items-center justify-between">

                    <span className="text-sm font-medium text-[#231e1d]">
                      Cumplimiento General
                    </span>

                    <span className="text-sm font-bold text-[#b5854b]">
                      {data.resumen.cumplimientoGeneral}%
                    </span>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white">

                    <div
                      className="h-full rounded-full bg-[#b5854b]"
                      style={{
                        width: `${data.resumen.cumplimientoGeneral}%`,
                      }}
                    />

                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

        {/* TABLA */}
        {data && (
          <ReporteTalleresTable data={data.data} />
        )}

      </div>

    </div>
  );
}

function EstadoItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3">

      <div className="flex items-center gap-3">

        <div className={`h-3 w-3 rounded-full ${color}`} />

        <span className="font-medium text-[#231e1d]">
          {label}
        </span>

      </div>

      <span className="font-bold text-[#231e1d]">
        {value}
      </span>

    </div>
  );
}