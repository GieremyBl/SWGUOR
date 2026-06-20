'use client';

import { useEffect } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ManufacturaCuellosBotella } from './ManufacturaCuellosBotella';
import { ManufacturaEficienciaStats } from './ManufacturaEficienciaStats';
import { ManufacturaEtapasChart } from './ManufacturaEtapasChart';
import { ManufacturaPrioridadTable } from './ManufacturaPrioridadTable';
import { useReporteManufacturaEficiencia } from '@/lib/hooks/useReporteManufacturaEficiencia';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { formatPorcentaje } from '@/lib/helpers/eficiencia-manufactura.helper';

export default function ReporteManufacturaEficienciaPage() {
  const { can, hasRole, isLoading: authLoading } = usePermissions();
  const { data, loading, error, refetch } = useReporteManufacturaEficiencia();

  const puedeVer =
    can('view', 'orden_produccion') ||
    hasRole(['administrador', 'gerente', 'cortador', 'representante_taller']);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (authLoading) {
    return (
      <div className="p-10 text-center text-slate-500 font-medium animate-pulse">
        Cargando eficiencia de manufactura...
      </div>
    );
  }

  if (!puedeVer) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-4 opacity-30" />
        <h2 className="text-2xl font-black text-slate-900">Acceso Restringido</h2>
        <p className="text-slate-500 max-w-md mt-2">
          No cuentas con permisos para consultar el dashboard de eficiencia de manufactura.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50/80 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 md:p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="uppercase tracking-[0.2em] text-xs font-semibold text-indigo-100">
                GUOR · REPORTES · MANUFACTURA
              </p>
              <h1 className="text-3xl md:text-4xl font-black mt-2">Eficiencia de Manufactura</h1>
              <p className="text-indigo-100 mt-3 text-sm md:text-base max-w-2xl">
                Seguimiento operativo de órdenes de producción, etapas, cuellos de botella y
                entregas críticas basado en seguimiento_produccion.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={refetch}
              disabled={loading}
              className="rounded-xl shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
          {data?.kpis && (
            <p className="mt-4 text-sm text-indigo-100">
              Ratio de producción:{' '}
              <span className="font-bold text-white">
                {formatPorcentaje(data.kpis.ratio_produccion_pct)}
              </span>{' '}
              de prendas solicitadas ya completadas
            </p>
          )}
        </div>

        <ManufacturaEficienciaStats kpis={data?.kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ManufacturaEtapasChart
              data={data?.etapas_funnel ?? []}
              loading={loading && !data}
            />
          </div>
          <ManufacturaCuellosBotella
            cuellos={data?.cuellos_botella ?? []}
            loading={loading && !data}
          />
        </div>

        <ManufacturaPrioridadTable ops={data?.prioridad_ops ?? []} loading={loading && !data} />
      </div>
    </div>
  );
}
