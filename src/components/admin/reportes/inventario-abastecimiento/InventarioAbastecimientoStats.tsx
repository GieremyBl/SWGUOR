'use client';

import StatCard from '@/components/admin/common/StatCard';
import type { ReporteInventarioKpis } from '@/lib/schemas/reporte-inventario-abastecimiento';
import { formatValorizacionInventario } from '@/lib/helpers/reporte-inventario.helper';
import { AlertTriangle, ArrowLeftRight, PackageX, Warehouse } from 'lucide-react';

interface Props {
  kpis: ReporteInventarioKpis | undefined;
}

export function InventarioAbastecimientoStats({ kpis }: Props) {
  const almacenTop = kpis?.almacen_mayor_ocupacion;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Artículos Bajo Stock Mínimo"
        value={kpis?.articulos_bajo_minimo ?? 0}
        icon={PackageX}
        color="red"
        disabled
      />
      <StatCard
        title="Valorización Total del Inventario"
        value={formatValorizacionInventario(kpis?.valorizacion_total ?? 0)}
        icon={Warehouse}
        color="indigo"
        disabled
      />
      <StatCard
        title="Movimientos en las últimas 24h"
        value={kpis?.movimientos_24h ?? 0}
        icon={ArrowLeftRight}
        color="blue"
        disabled
      />
      <StatCard
        title="Almacén con Mayor Ocupación"
        value={
          almacenTop
            ? `${almacenTop.nombre} (${almacenTop.porcentaje.toFixed(1)}%)`
            : 'Sin datos'
        }
        icon={AlertTriangle}
        color="amber"
        disabled
      />
    </div>
  );
}
