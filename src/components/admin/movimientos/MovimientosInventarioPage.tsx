'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import {
  MovimientosTable,
  MovimientosFilters,
  EstadisticasMovimientos,
  ExportarMovimientos,
  type Movimiento,
  type MovimientosFiltersState,
  type EstadisticasMovimientosType,
} from '@/components/admin/movimientos';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import {
  obtenerEstadisticasMovimientos,
  obtenerMovimientos,
} from '@/app/admin/inventario/movimientos/actions';

const ESTADISTICAS_INICIALES: EstadisticasMovimientosType = {
  totalEntradas: 0,
  totalSalidas: 0,
  totalAjustes: 0,
  totalMovimientos: 0,
  montoTotalEntradas: 0,
  montoTotalSalidas: 0,
};

function mapUiFiltersToAction(f: MovimientosFiltersState) {
  return {
    search: f.busqueda,
    busqueda: f.busqueda,
    tipo_movimiento: f.tipoMovimiento,
    tipoMovimiento: f.tipoMovimiento,
    referencia_tipo: f.referenciaMovimiento,
    referenciaMovimiento: f.referenciaMovimiento,
    tipoItem: f.tipoItem,
    fecha_inicio: f.desde,
    fecha_fin: f.hasta,
    desde: f.desde,
    hasta: f.hasta,
  };
}

export function MovimientosInventarioPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasMovimientosType>(
    ESTADISTICAS_INICIALES,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<MovimientosFiltersState>({});

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    const payload = mapUiFiltersToAction(filters);

    try {
      const [movRes, statsRes] = await Promise.all([
        obtenerMovimientos(payload),
        obtenerEstadisticasMovimientos(payload),
      ]);

      if (!movRes.success) {
        throw new Error(movRes.error);
      }
      setMovimientos((movRes.data ?? []) as unknown as Movimiento[]);
      if (statsRes.success && statsRes.data) {
        setEstadisticas({
          totalEntradas: statsRes.data.totalEntradas ?? 0,
          totalSalidas: statsRes.data.totalSalidas ?? 0,
          totalAjustes: statsRes.data.totalAjustes ?? 0,
          totalMovimientos: statsRes.data.totalMovimientos ?? 0,
          montoTotalEntradas: 0,
          montoTotalSalidas: 0,
        });
      } else {
        setEstadisticas(ESTADISTICAS_INICIALES);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al cargar los datos';
      toast.error(message);
      setMovimientos([]);
      setEstadisticas(ESTADISTICAS_INICIALES);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <AdminPageHeader
          title="Movimientos de Inventario"
          description="Registro y seguimiento detallado de entradas, salidas y ajustes de stock"
          actionLabel="Actualizar"
          onAction={loadAll}
          icon={RefreshCw}
        />

        <EstadisticasMovimientos estadisticas={estadisticas} isLoading={isLoading} />

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <MovimientosFilters onFilterChange={setFilters} />

          <div className="flex justify-between items-center pt-4 border-t border-gray-50">
            <p className="text-xs text-slate-400 font-medium">
              Mostrando{' '}
              <span className="text-slate-900 font-bold">{movimientos.length}</span>{' '}
              registros
              {!filters.busqueda &&
                !filters.tipoMovimiento &&
                !filters.desde &&
                !filters.hasta &&
                !filters.referenciaMovimiento &&
                !filters.tipoItem && (
                  <span className="text-slate-400"> (últimos 50 por defecto)</span>
                )}
            </p>
            <ExportarMovimientos
              movimientos={movimientos}
              titulo="Movimientos_Inventario"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden p-8 flex flex-col items-center justify-center min-h-[400px]">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest animate-pulse text-xs">
              Sincronizando inventario…
            </p>
          </div>
        ) : (
          <MovimientosTable movimientos={movimientos} />
        )}
      </div>
    </div>
  );
}
