'use client';

import { useCallback, useEffect, useState } from 'react';
import { REPORTE_INVENTARIO_FILTRO_TODOS } from '@/lib/constants/reporte-inventario';
import type { ReporteInventarioAbastecimientoResponse } from '@/lib/schemas/reporte-inventario-abastecimiento';

export interface ReporteInventarioFiltros {
  categoria_id: number | typeof REPORTE_INVENTARIO_FILTRO_TODOS;
  almacen_id: number | typeof REPORTE_INVENTARIO_FILTRO_TODOS;
}

export function useReporteInventarioAbastecimiento(filtros: ReporteInventarioFiltros) {
  const [data, setData] = useState<ReporteInventarioAbastecimientoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        categoria_id: String(filtros.categoria_id),
        almacen_id: String(filtros.almacen_id),
      });

      const response = await fetch(
        `/api/admin/reportes/inventario-abastecimiento?${params.toString()}`,
      );

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error ?? 'Error cargando reporte');
      }

      const result: ReporteInventarioAbastecimientoResponse = await response.json();
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros.almacen_id, filtros.categoria_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
}
