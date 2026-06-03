'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, FileText, Truck, CheckCircle2, AlertCircle, Layers, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePortal } from '@/lib/hooks/usePortal';
import { KpiCards } from '@/components/portal/dashboard/KpiCards';
import { RecentQuotes } from '@/components/portal/dashboard/RecentQuotes';
import { RecentOrders } from '@/components/portal/dashboard/RecentOrders';
import { DashboardSkeleton } from '@/components/portal/dashboard/DashboardSkeleton';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import type { EstadoCotizacion, EstadoPedido } from '@prisma/client';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CotizacionReciente {
  id: number;
  numero: string;
  total: number | null;
  estado: EstadoCotizacion;
  created_at: string;
  total_items: number;
  moneda: string;
}

interface PedidoReciente {
  id: number;
  estado: EstadoPedido;
  total: number;
  created_at: string;
  total_unidades: number;
  moneda: string;
}

interface DashboardStats {
  cotizaciones_pendientes: number;
  pedidos_en_produccion: number;
  pedidos_listos: number;
  despachos_en_ruta: number;
  total_gastado: number;
}

interface DashboardData {
  cotizaciones: CotizacionReciente[];
  pedidos: PedidoReciente[];
  stats: DashboardStats;
}

interface KpiItem {
  label: string;
  value: number;
  sub: string;
  icon: LucideIcon; // ◄ Tipado correcto para matchear con tu componente
  href: string;
}


// ─── Componente Principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { cliente } = usePortal();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!cliente) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/portal/dashboard', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al obtener datos del servidor');

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Error en respuesta');

      setData(json.data);
    } catch (err) {
      setError('No se pudo cargar la información.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [cliente]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle size={40} className="text-guor-400" />
        <p className="text-guor-soft font-bold uppercase text-xs tracking-wider">{error}</p>
        <button onClick={fetchData} className="px-6 py-2.5 bg-guor-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all hover:bg-guor-700 active:scale-95">Reintentar</button>
      </div>
    );
  }

  const s = data?.stats;
  const primerNombre = cliente?.nombre_comercial ?? 'Cliente';
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  // ◄ Declarado con tipo estricto KpiItem[] para asegurar coherencia en TypeScript
  const KPIS: KpiItem[] = [
    { label: 'Cotizaciones', value: s?.cotizaciones_pendientes ?? 0, sub: 'Pendientes de cierre', icon: FileText, href: '/portal/cotizaciones' },
    { label: 'En producción', value: s?.pedidos_en_produccion ?? 0, sub: 'Órdenes activas', icon: Layers, href: '/portal/pedidos' },
    { label: 'Listos', value: s?.pedidos_listos ?? 0, sub: 'Para despacho', icon: CheckCircle2, href: '/portal/pedidos' },
    { label: 'En ruta', value: s?.despachos_en_ruta ?? 0, sub: 'Entregas en camino', icon: Truck, href: '/portal/despachos' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* ── Cabecera Compacta ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-guor-line">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-guor-50 border border-guor-200">
            <Sparkles size={10} className="text-guor-500" />
            <span className="text-[9px] font-bold text-guor-600 uppercase tracking-wider">{saludo}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-guor-ink tracking-tight">
            Hola, <span className="text-guor-600">{primerNombre}</span>
          </h1>
          <p className="text-guor-soft font-bold uppercase text-[9px] tracking-wider">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end justify-center px-4 py-2 bg-guor-surface border border-guor-line rounded-xl shadow-card">
            <span className="text-[9px] font-bold text-guor-soft uppercase tracking-wider">Inversión Total</span>
            <span className="text-lg font-black text-guor-ink">{formatCurrency(s?.total_gastado ?? 0)}</span>
          </div>
          <Link
            href="/portal/cotizaciones/nueva"
            className="flex items-center gap-2 px-5 py-3 bg-guor-600 hover:bg-guor-700 text-white rounded-xl font-bold uppercase text-[11px] tracking-wider transition-all shadow-sm active:scale-95"
          >
            <Plus size={14} />
            Nueva Solicitud
          </Link>
        </div>
      </div>

      {/* ── Módulos Separados ── */}
      <KpiCards kpis={KPIS} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentQuotes cotizaciones={data?.cotizaciones ?? []} />
        </div>
        <div>
          <RecentOrders pedidos={data?.pedidos ?? []} />
        </div>
      </div>

    </div>
  );
}
