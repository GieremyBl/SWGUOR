'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MonedaAnaliticaFiltro } from '@/lib/constants/analitica-financiera';
import type { ReporteAnaliticaFinancieraResponse } from '@/lib/schemas/reporte-analitica-financiera';

export function useReporteAnaliticaFinanciera(moneda: MonedaAnaliticaFiltro) {
  const [data, setData] = useState<ReporteAnaliticaFinancieraResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ moneda });
      const response = await fetch(`/api/admin/reportes/analitica-financiera?${params.toString()}`);

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error ?? 'Error cargando reporte');
      }

      const result: ReporteAnaliticaFinancieraResponse = await response.json();
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [moneda]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
}
