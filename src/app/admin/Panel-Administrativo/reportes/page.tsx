'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Download, RefreshCw, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  ReportFilters,
  ReportStats,
  RevenueChart,
  CategoryProfitability,
  SizeAnalysis,
  LoadingSpinner,
} from '@/components/admin/reportes';

// ── Tipos ────────────────────────────────────────────────────────────────────
interface ReportMetrics {
  total: number;
  pedidos: number;
  produccionEnCurso: number;
}

interface DiaVenta     { fecha: string; ventas: number }
interface ItemTalla    { name: string;  value: number  }
interface ItemCategoria{ name: string;  value: number  }

// ── Utilidades ───────────────────────────────────────────────────────────────
const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style:                 'currency',
    currency:              'PEN',
    minimumFractionDigits: 1,
  }).format(val);

// ── Tooltip compartido ───────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data  = payload[0].payload;
  const value = payload[0].value as number;

  return (
    <div className="bg-white p-4 border border-stone-100 rounded-2xl shadow-xl min-w-[160px]">
      <p className="text-[9px] font-black text-rose-600 uppercase tracking-wider mb-2">
        Control Interno
      </p>
      <p className="text-xs font-bold text-stone-800 mb-2">
        {data.name ?? data.fecha}
      </p>
      <div className="space-y-1 border-t border-stone-100 pt-2 text-xs">
        <div className="flex justify-between items-center gap-4">
          <span className="text-stone-400 text-[10px]">Monto:</span>
          <span className="font-black text-stone-900">
            S/ {value.toLocaleString('es-PE')}
          </span>
        </div>
        {data.quantity && (
          <div className="flex justify-between items-center gap-4">
            <span className="text-stone-400 text-[10px]">Unidades:</span>
            <span className="font-bold text-stone-700">{data.quantity} und.</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ReportesPage() {
  const { can, isLoading: authLoading } = usePermissions();

  const [loading,        setLoading]        = useState(true);
  const [range,          setRange]          = useState('30');
  const [isMounted,      setIsMounted]      = useState(false);
  const [metrics,        setMetrics]        = useState<ReportMetrics | null>(null);
  const [dataVentas,     setDataVentas]     = useState<DiaVenta[]>([]);
  const [dataTallas,     setDataTallas]     = useState<ItemTalla[]>([]);
  const [dataCategorias, setDataCategorias] = useState<ItemCategoria[]>([]);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reportes?days=${range}`);
      if (!res.ok) throw new Error('Error de conexión');
      const data = await res.json();

      setMetrics(data.metrics);
      setDataVentas(data.ventasPorDia       ?? []);
      setDataTallas(data.concentracionTallas ?? []);
      setDataCategorias(data.ventasPorCategoria ?? []);
    } catch {
      toast.error('Error al sincronizar datos del reporte');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!authLoading && can('view', 'reportes')) loadReportData();
  }, [authLoading, can, loadReportData]);

  if (authLoading || (loading && !metrics)) return <LoadingSpinner />;

  return (
    <div className="space-y-6 w-full p-1">

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div className="flex items-start gap-3">
          {/* Ícono decorativo */}
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-100">
            <BarChart2 className="h-5 w-5 text-rose-600" />
          </div>

          <div>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
              Modas y Estilos Guor · Panel Administrativo
            </p>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-0.5">
              Reportes Administrativos
            </h1>
            <p className="text-xs text-stone-400 font-medium mt-0.5">
              Análisis de rendimiento financiero y operativo · últimos {range} días
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => toast.success('Preparando descarga corporativa…')}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white tracking-wide shadow-sm transition-colors hover:bg-rose-700 active:scale-95"
          >
            <Download size={14} />
            Exportar datos
          </button>

          <ReportFilters
            range={range}
            setRange={setRange}
            onRefresh={loadReportData}
            isLoading={loading}
          />
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <ReportStats metrics={metrics} formatCurrency={formatCurrency} />

      {/* ── Gráficos ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna principal */}
        <div className="lg:col-span-8 space-y-6">
          <RevenueChart
            data={dataVentas}
            totalPeriodo={metrics?.total ?? 0}
            formatCurrency={formatCurrency}
            isMounted={isMounted}
            CustomTooltip={CustomTooltip}
          />
          <CategoryProfitability
            data={dataCategorias}
            CustomTooltip={CustomTooltip}
          />
        </div>

        {/* Columna lateral fija */}
        <div className="lg:col-span-4 lg:sticky lg:top-6">
          <SizeAnalysis data={dataTallas} />
        </div>
      </section>
    </div>
  );
}