'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { AnaliticaFinancieraDeudoresTable } from './AnaliticaFinancieraDeudoresTable';
import { AnaliticaFinancieraFilters } from './AnaliticaFinancieraFilters';
import { AnaliticaFinancieraStats } from './AnaliticaFinancieraStats';
import { AnaliticaFinancieraTrendChart } from './AnaliticaFinancieraTrendChart';
import type { MonedaAnaliticaFiltro } from '@/lib/constants/analitica-financiera';
import { useReporteAnaliticaFinanciera } from '@/lib/hooks/useReporteAnaliticaFinanciera';
import { usePermissions } from '@/lib/hooks/usePermissions';

export default function ReporteAnaliticaFinancieraPage() {
  const { hasRole, isLoading: authLoading } = usePermissions();
  const [moneda, setMoneda] = useState<MonedaAnaliticaFiltro>('PEN');
  const { data, loading, error, refetch } = useReporteAnaliticaFinanciera(moneda);

  const puedeVer = hasRole(['administrador', 'gerente']);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (authLoading) {
    return (
      <div className="p-10 text-center text-[#6b5b52] font-medium animate-pulse">
        Cargando reporte financiero...
      </div>
    );
  }

  if (!puedeVer) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-4 opacity-30" />
        <h2 className="text-2xl font-black text-[#231e1d]">Acceso Restringido</h2>
        <p className="text-[#6b5b52] max-w-md mt-2">
          Solo gerencia puede consultar la analítica financiera y cuentas por cobrar.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[#fff4e2] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-[#fbddd3] rounded-3xl p-6 md:p-8 border border-[#e4c28a]">
          <p className="text-[#b5854b] uppercase tracking-[0.2em] text-xs font-semibold">
            GUOR · REPORTES
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-[#231e1d] mt-2">
            Analítica Financiera y Recaudación
          </h1>
          <p className="text-[#6b5b52] mt-3 text-sm md:text-base max-w-3xl">
            Salud financiera del negocio cruzando pedidos, pagos efectivos y cuentas por cobrar.
            El saldo pendiente considera pedidos en estado pendiente o con pago parcial activo.
          </p>
        </div>

        <AnaliticaFinancieraFilters
          moneda={moneda}
          loading={loading}
          onMonedaChange={setMoneda}
          onRefresh={refetch}
        />

        <AnaliticaFinancieraStats kpis={data?.kpis} moneda={moneda} />

        <AnaliticaFinancieraTrendChart data={data?.tendencia ?? []} moneda={moneda} />

        <AnaliticaFinancieraDeudoresTable
          deudores={data?.top_deudores ?? []}
          moneda={moneda}
          loading={loading && !data}
        />
      </div>
    </div>
  );
}
