'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReporteManufacturaEficienciaResponse } from '@/lib/schemas/reporte-eficiencia-manufactura';

export function useReporteManufacturaEficiencia() {
  const [data, setData] = useState<ReporteManufacturaEficienciaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/reportes/eficiencia-manufactura');
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error ?? 'Error cargando reporte');
      }
      const result: ReporteManufacturaEficienciaResponse = await response.json();
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
}
