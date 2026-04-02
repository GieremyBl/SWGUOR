'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  Plus, ArrowRight, FileText, ShoppingBag, 
  Truck, Calendar
} from 'lucide-react';
import { usePortal } from '../_contexts/PortalContext';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDateLong } from '@/lib/helpers/format-helpers';
import { cn } from '@/lib/utils';

interface CotizacionReciente {
  id: number;
  numero: string;
  total: number;
  estado: string;
  created_at: string;
  total_items: number;
}

export default function DashboardPage() {
  const { cliente, stats } = usePortal();
  const [recientes, setRecientes] = useState<CotizacionReciente[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!cliente) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('cotizaciones')
        .select('id, numero, total, estado, created_at, cotizacion_items(count)')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecientes((data ?? []).map((c: any) => ({
        ...c, total_items: c.cotizacion_items?.[0]?.count ?? 0,
      })));
      setLoadingData(false);
    };
    fetch();
  }, [cliente]);

  const KPIs = [
    { label: 'Cotizaciones', value: stats.cotizaciones_activas, sub: 'Pendientes de cierre', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Órdenes', value: stats.ordenes_activas, sub: 'En producción', icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'En Ruta', value: stats.despachos_en_ruta, sub: 'Próximas entregas', icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header simplificado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Hola, {cliente?.razon_social.split(' ')[0]} 👋
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Calendar size={14} />
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal/cotizaciones/nueva"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Plus size={16} />
            Nueva Cotización
          </Link>
        </div>
      </div>

      {/* Grid de KPIs - Ahora el foco principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {KPIs.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl transition-colors", kpi.bg, kpi.color)}>
                <kpi.icon size={22} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 leading-none">{kpi.value}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de Actividad Reciente */}
      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Actividad Reciente</h2>
            <p className="text-[11px] text-slate-400 font-bold mt-1">Últimos movimientos de tu cuenta</p>
          </div>
          <Link href="/portal/cotizaciones" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 group">
            Ver todo el historial 
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loadingData ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Sincronizando con servidor...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/20">
                  <th className="px-8 py-4 text-left font-black">N° Documento</th>
                  <th className="px-8 py-4 text-left font-black">Emisión</th>
                  <th className="px-8 py-4 text-left font-black">Modelos</th>
                  <th className="px-8 py-4 text-left font-black">Total</th>
                  <th className="px-8 py-4 text-left font-black">Estado</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recientes.length > 0 ? recientes.map(c => (
                  <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-5 font-bold text-slate-900 tracking-tight">{c.numero}</td>
                    <td className="px-8 py-5 text-slate-500 font-medium text-xs">{formatDateLong(c.created_at)}</td>
                    <td className="px-8 py-5 text-slate-400 text-xs font-bold uppercase">{c.total_items} items</td>
                    <td className="px-8 py-5 font-black text-slate-900">{formatCurrency(c.total)}</td>
                    <td className="px-8 py-5">
                      <EstadoBadge estado={c.estado} tipo="cotizacion" />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link href={`/portal/cotizaciones/${c.id}`} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                      No se registraron cotizaciones recientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}