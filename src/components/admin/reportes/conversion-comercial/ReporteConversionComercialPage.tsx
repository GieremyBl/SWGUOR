'use client';

import { useEffect } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConversionAnalisisPerdida } from './ConversionAnalisisPerdida';
import { ConversionComercialEmbudo } from './ConversionComercialEmbudo';
import { ConversionTasaCierreChart } from './ConversionTasaCierreChart';
import { ConversionTopClientesTable } from './ConversionTopClientesTable';
import { useReporteConversionComercial } from '@/lib/hooks/useReporteConversionComercial';
import { usePermissions } from '@/lib/hooks/usePermissions';

export default function ReporteConversionComercialPage() {
  const { can, hasRole, isLoading: authLoading } = usePermissions();
  const { data, loading, error, refetch } = useReporteConversionComercial();

  const puedeVer =
    can('view', 'cotizaciones') ||
    hasRole(['administrador', 'gerente', 'recepcionista']);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (authLoading) {
    return (
      <div className="p-10 text-center text-[#6b5b52] font-medium animate-pulse">
        Cargando conversión comercial...
      </div>
    );
  }

  if (!puedeVer) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-4 opacity-30" />
        <h2 className="text-2xl font-black text-[#231e1d]">Acceso Restringido</h2>
        <p className="text-[#6b5b52] max-w-md mt-2">
          No cuentas con permisos para consultar el reporte de conversión comercial.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[#fff4e2] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-[#fbddd3] rounded-3xl p-6 md:p-8 border border-[#e4c28a]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[#b5854b] uppercase tracking-[0.2em] text-xs font-semibold">
                GUOR · REPORTES · CRM
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-[#231e1d] mt-2">
                Conversión Comercial y Cotizaciones
              </h1>
              <p className="text-[#6b5b52] mt-3 text-sm md:text-base max-w-3xl">
                Embudo desde cotización hasta pedido, tasa de cierre mensual, ranking de
                clientes y análisis de cotizaciones expiradas.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={refetch}
              disabled={loading}
              className="rounded-xl border-[#e4c28a] shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        <ConversionComercialEmbudo
          embudo={data?.embudo ?? []}
          tasaGlobal={data?.tasa_cierre_global_pct ?? 0}
        />

        <ConversionTasaCierreChart
          data={data?.tasa_cierre_mensual ?? []}
          loading={loading && !data}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ConversionTopClientesTable
              clientes={data?.top_clientes ?? []}
              loading={loading && !data}
            />
          </div>
          <ConversionAnalisisPerdida
            motivos={data?.analisis_perdida ?? []}
            loading={loading && !data}
          />
        </div>
      </div>
    </div>
  );
}
