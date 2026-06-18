"use client";

import React from 'react';
import {
  Truck, Layers, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { SparkKpiCard } from './widgets/DashboardWidgets';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';
import DashboardLoader from './DashboardLoaders';
import DashboardGanttTimeline from './DashboardGanttTimeline';
import type { RepresentanteMetrics, DashboardKpis } from '@/lib/services/dashboard.service';

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface RepresentanteData {
  kpis:           DashboardKpis;
  representante:  RepresentanteMetrics;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardRepresentante() {
  const G = COMPANY_PALETTE;
  const [data, setData] = React.useState<RepresentanteData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/admin/dashboard?role=representante_taller')
      .then((r) => r.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLoader message="Cargando control de talleres..." />;

  const rep      = data?.representante;
  const lotes    = rep?.lotes_externos    ?? [];
  const ruta     = rep?.ruta_hoy          ?? [];
  const leadTime = rep?.lead_time_dias    ?? 0;

  return (
    <DashboardSection
      title="Control de Talleres"
      role="representante_taller"
      subtitle="Logística externa, control de maquila y tiempos de entrega"
    >
      <div className="space-y-5">

        {/* 1 ─ KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SparkKpiCard
            label="Lotes en Proceso"
            value={lotes.length}
            delta={3}
            icon={Truck}
            accentColor={G.accent}
            sparkData={[10, 15, 12, 14, 16, lotes.length]}
          />
          <SparkKpiCard
            label="Prendas Activas"
            value={lotes.reduce((a, b) => a + b.avance, 0)}
            delta={-5}
            icon={Layers}
            accentColor={G.accent}
            sparkData={[2800, 2600, 2500, 2450]}
          />
          <SparkKpiCard
            label="Calidad Entrega"
            value="99.2%"
            delta={1}
            icon={CheckCircle2}
            accentColor={G.accent}
            sparkData={[95, 96, 98, 97, 99]}
          />
          <SparkKpiCard
            label="Alertas Retraso"
            value={rep?.retrasados ?? 0}
            delta={rep?.retrasados ? 100 : 0}
            icon={AlertTriangle}
            accentColor="#ef4444"
            sparkData={[0, 0, 1, 0, rep?.retrasados ?? 0]}
          />
        </div>

        <div className="space-y-5">
          <DashboardGanttTimeline lotes={lotes} />
        </div>
      </div>
    </DashboardSection>
  );
}