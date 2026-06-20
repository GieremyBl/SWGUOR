'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { InventarioAbastecimientoFilters } from './InventarioAbastecimientoFilters';
import { InventarioAbastecimientoStats } from './InventarioAbastecimientoStats';
import { InventarioAlertasRojas } from './InventarioAlertasRojas';
import { InventarioOcupacionAlmacenes } from './InventarioOcupacionAlmacenes';
import { REPORTE_INVENTARIO_FILTRO_TODOS } from '@/lib/constants/reporte-inventario';
import {
  useReporteInventarioAbastecimiento,
  type ReporteInventarioFiltros,
} from '@/lib/hooks/useReporteInventarioAbastecimiento';
import { usePermissions } from '@/lib/hooks/usePermissions';

const FILTROS_INICIALES: ReporteInventarioFiltros = {
  categoria_id: REPORTE_INVENTARIO_FILTRO_TODOS,
  almacen_id: REPORTE_INVENTARIO_FILTRO_TODOS,
};

export default function ReporteInventarioAbastecimientoPage() {
  const { can, hasRole, isLoading: authLoading } = usePermissions();
  const [filtros, setFiltros] = useState<ReporteInventarioFiltros>(FILTROS_INICIALES);
  const { data, loading, error, refetch } = useReporteInventarioAbastecimiento(filtros);

  const puedeVer =
    can('view', 'inventario') ||
    hasRole(['administrador', 'gerente', 'almacenero']);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (authLoading) {
    return (
      <div className="p-10 text-center text-slate-500 font-medium animate-pulse">
        Cargando reporte de inventario...
      </div>
    );
  }

  if (!puedeVer) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-4 opacity-30" />
        <h2 className="text-2xl font-black text-slate-900">Acceso Restringido</h2>
        <p className="text-slate-500 max-w-md mt-2">
          No cuentas con permisos para consultar la gestión de inventarios y abastecimiento.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50/80 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <p className="text-indigo-600 uppercase tracking-[0.2em] text-xs font-semibold">
            GUOR · REPORTES
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">
            Gestión de Inventarios y Abastecimiento
          </h1>
          <p className="text-slate-600 mt-3 text-sm md:text-base max-w-3xl">
            Control de stock crítico, valorización de inventario, movimientos recientes y ocupación
            de almacenes cruzando insumos, materiales y movimientos de inventario.
          </p>
        </div>

        <InventarioAbastecimientoFilters
          filtros={filtros}
          categorias={data?.filtros.categorias ?? []}
          almacenes={data?.filtros.almacenes ?? []}
          loading={loading}
          onChange={(patch) => setFiltros((prev) => ({ ...prev, ...patch }))}
          onRefresh={refetch}
        />

        <InventarioAbastecimientoStats kpis={data?.kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <InventarioAlertasRojas
              alertas={data?.alertas_rojas ?? []}
              loading={loading && !data}
            />
          </div>
          <InventarioOcupacionAlmacenes
            almacenes={data?.ocupacion_almacenes ?? []}
            loading={loading && !data}
          />
        </div>
      </div>
    </div>
  );
}
