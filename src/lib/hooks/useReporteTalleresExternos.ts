'use client';

import { useEffect, useState } from 'react';
import type {
  ReporteTallerFilters,
  ReporteTallerResponse,
} from '@/types/reporte-talleres';

export function useReporteTalleresExternos(
  filters?: ReporteTallerFilters,
) {
  const [data, setData] = useState<ReporteTallerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [JSON.stringify(filters)]);

  const loadData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (filters?.taller) {
        params.append('taller', filters.taller);
      }

      if (filters?.estado && filters.estado !== 'todos') {
        params.append('estado', filters.estado);
      }

      if (filters?.fechaInicio) {
        params.append('fechaInicio', filters.fechaInicio);
      }

      if (filters?.fechaFin) {
        params.append('fechaFin', filters.fechaFin);
      }

      const response = await fetch(
        `/api/admin/reportes/talleres-externos?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Error cargando reporte');
      }

      const result = await response.json();

      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    reload: loadData,
  };
}