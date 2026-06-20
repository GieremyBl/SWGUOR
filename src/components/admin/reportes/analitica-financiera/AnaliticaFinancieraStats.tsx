'use client';

import StatCard from '@/components/admin/common/StatCard';
import type { AnaliticaFinancieraKpis } from '@/lib/schemas/reporte-analitica-financiera';
import { formatMontoAnalitica } from '@/lib/helpers/analitica-financiera.helper';
import type { MonedaAnaliticaFiltro } from '@/lib/constants/analitica-financiera';
import { AlertTriangle, Banknote, PiggyBank, TrendingUp } from 'lucide-react';

interface Props {
  kpis: AnaliticaFinancieraKpis | undefined;
  moneda: MonedaAnaliticaFiltro;
}

export function AnaliticaFinancieraStats({ kpis, moneda }: Props) {
  const morosidad = kpis?.porcentaje_morosidad ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Ingresos Totales (Ventas)"
        value={formatMontoAnalitica(kpis?.ingresos_totales ?? 0, moneda)}
        icon={TrendingUp}
        color="indigo"
        disabled
      />
      <StatCard
        title="Monto Recaudado (Caja Real)"
        value={formatMontoAnalitica(kpis?.monto_recaudado ?? 0, moneda)}
        icon={Banknote}
        color="emerald"
        disabled
      />
      <StatCard
        title="Saldo Pendiente (CxC)"
        value={formatMontoAnalitica(kpis?.saldo_pendiente ?? 0, moneda)}
        icon={PiggyBank}
        color="amber"
        disabled
      />
      <StatCard
        title="% de Morosidad"
        value={`${morosidad.toFixed(1)}%`}
        icon={AlertTriangle}
        color={morosidad >= 25 ? 'red' : morosidad >= 10 ? 'orange' : 'blue'}
        disabled
      />
    </div>
  );
}
