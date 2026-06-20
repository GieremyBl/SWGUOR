'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { REPORTE_INVENTARIO_FILTRO_TODOS } from '@/lib/constants/reporte-inventario';
import type { ReporteInventarioFiltroOpcion } from '@/lib/schemas/reporte-inventario-abastecimiento';
import type { ReporteInventarioFiltros } from '@/lib/hooks/useReporteInventarioAbastecimiento';

interface Props {
  filtros: ReporteInventarioFiltros;
  categorias: ReporteInventarioFiltroOpcion[];
  almacenes: ReporteInventarioFiltroOpcion[];
  loading: boolean;
  onChange: (patch: Partial<ReporteInventarioFiltros>) => void;
  onRefresh: () => void;
}

export function InventarioAbastecimientoFilters({
  filtros,
  categorias,
  almacenes,
  loading,
  onChange,
  onRefresh,
}: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <select
        value={String(filtros.categoria_id)}
        onChange={(e) => {
          const value = e.target.value;
          onChange({
            categoria_id:
              value === REPORTE_INVENTARIO_FILTRO_TODOS
                ? REPORTE_INVENTARIO_FILTRO_TODOS
                : Number(value),
          });
        }}
        className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-medium flex-1"
        aria-label="Filtrar por categoría de insumo"
      >
        <option value={REPORTE_INVENTARIO_FILTRO_TODOS}>Todas las categorías</option>
        {categorias.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

      <select
        value={String(filtros.almacen_id)}
        onChange={(e) => {
          const value = e.target.value;
          onChange({
            almacen_id:
              value === REPORTE_INVENTARIO_FILTRO_TODOS
                ? REPORTE_INVENTARIO_FILTRO_TODOS
                : Number(value),
          });
        }}
        className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-medium flex-1"
        aria-label="Filtrar por almacén"
      >
        <option value={REPORTE_INVENTARIO_FILTRO_TODOS}>Todos los almacenes</option>
        {almacenes.map((alm) => (
          <option key={alm.value} value={alm.value}>
            {alm.label}
          </option>
        ))}
      </select>

      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={loading}
        className="h-11 rounded-xl shrink-0"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Actualizar
      </Button>
    </div>
  );
}
