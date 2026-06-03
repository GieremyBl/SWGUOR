'use client';

import {
  useEffect,
  useState,
} from 'react';

import type {
  ReporteIncidenciasResponse,
} from '@/types/reporte-incidencias';

interface Filters {
  severidad?: string;
  tipo?: string;
}

export function useReporteIncidencias(
  filters?: Filters,
) {

  const [data, setData] =
    useState<ReporteIncidenciasResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const loadData = async () => {

    try {

      setLoading(true);

      const params =
        new URLSearchParams();

      if (filters?.severidad) {

        params.append(
          'severidad',
          filters.severidad,
        );
      }

      if (filters?.tipo) {

        params.append(
          'tipo',
          filters.tipo,
        );
      }

      const response =
        await fetch(
          `/api/admin/reportes/incidencias?${params.toString()}`
        );

      if (!response.ok) {

        throw new Error(
          'Error cargando reporte',
        );
      }

      const result =
        await response.json();

      setData(result);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    loadData();

  }, [JSON.stringify(filters)]);

  return {

    data,

    loading,

    reload: loadData,
  };
}