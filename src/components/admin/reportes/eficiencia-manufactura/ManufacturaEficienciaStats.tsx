'use client';

import StatCard from '@/components/admin/common/StatCard';
import type { ManufacturaKpis } from '@/lib/schemas/reporte-eficiencia-manufactura';
import {
  formatDuracion,
  formatPorcentaje,
} from '@/lib/helpers/eficiencia-manufactura.helper';
import { CalendarCheck, Clock3, Factory, Shirt } from 'lucide-react';

interface Props {
  kpis: ManufacturaKpis | undefined;
}

export function ManufacturaEficienciaStats({ kpis }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Órdenes de Producción Activas"
        value={kpis?.ordenes_activas ?? 0}
        icon={Factory}
        color="indigo"
        disabled
      />
      <StatCard
        title="Tiempo Promedio de Confección"
        value={formatDuracion(kpis?.tiempo_promedio_confeccion_min ?? 0)}
        icon={Clock3}
        color="blue"
        disabled
      />
      <StatCard
        title="% Cumplimiento de Fechas"
        value={formatPorcentaje(kpis?.cumplimiento_fechas_pct ?? 0)}
        icon={CalendarCheck}
        color="emerald"
        disabled
      />
      <StatCard
        title="Prendas Producidas vs. Solicitadas"
        value={`${kpis?.prendas_producidas ?? 0} / ${kpis?.prendas_solicitadas ?? 0}`}
        icon={Shirt}
        color="pink"
        disabled
      />
    </div>
  );
}
