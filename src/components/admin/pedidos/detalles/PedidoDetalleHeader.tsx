'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Hash,
  TrendingUp,
  Package,
  Truck,
} from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { COMPANY_PALETTE } from '@/components/admin/dashboards/widgets/DashboardUtils';
import { Badge } from './PedidoDetalleUI';
import {
  ESTADO_CONFIG,
  PRIORIDAD_CONFIG,
  fmtDate,
  fmt,
  type DetallePedidoData,
} from './types';

const G = COMPANY_PALETTE;

interface PedidoDetalleHeaderProps {
  pedido: DetallePedidoData;
}

export function PedidoDetalleHeader({ pedido }: PedidoDetalleHeaderProps) {
  const { hasRole } = usePermissions();
  const puedeDespacho = hasRole(['administrador', 'gerente']);

  const estadoCfg    = ESTADO_CONFIG[pedido.estado]       ?? { label: pedido.estado,    color: 'bg-stone-50 text-stone-500 border-stone-200', icon: undefined };
  const prioridadCfg = PRIORIDAD_CONFIG[pedido.prioridad] ?? { label: pedido.prioridad, color: 'bg-stone-50 text-stone-500 border-stone-200' };
  const EstadoIcon   = estadoCfg.icon;

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        href="/admin/Panel-Administrativo/pedidos"
        className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest mb-3 transition-colors hover:opacity-70"
        style={{ color: G.accent }}
      >
        <ArrowLeft size={13} /> Volver a Pedidos
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Título + badges */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl shadow-sm flex-shrink-0" style={{ background: G.accent }}>
            <ShoppingBag size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Pedido #{pedido.id}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {EstadoIcon && (
                <Badge label={estadoCfg.label} color={estadoCfg.color} icon={EstadoIcon} />
              )}
              <Badge label={prioridadCfg.label} color={prioridadCfg.color} />
              {pedido.created_at && (
                <span className="text-[11px] text-stone-400 font-bold flex items-center gap-1">
                  <Calendar size={11} />
                  {fmtDate(pedido.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {puedeDespacho && pedido.estado === 'listo_para_despacho' && (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              href={`/admin/Panel-Administrativo/pedidos/${pedido.id}/empaque`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              <Package size={14} /> Empaque y despacho
            </Link>
            <Link
              href={`/admin/Panel-Administrativo/pedidos/${pedido.id}/entrega`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <Truck size={14} /> Confirmar entrega
            </Link>
          </div>
        )}

        {/* KPI chips */}
        <div className="flex gap-3 flex-shrink-0">
          {[
            { label: 'Total',    value: fmt(pedido.total, pedido.moneda),                  icon: TrendingUp },
            { label: 'Unidades', value: pedido.total_unidades.toLocaleString('es-PE'),     icon: Hash       },
          ].map((k) => (
            <div
              key={k.label}
              className="bg-white border border-stone-100 rounded-xl px-4 py-2.5 text-center shadow-sm min-w-[90px]"
            >
              <k.icon size={12} className="text-stone-400 mx-auto mb-0.5" />
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-sm font-black text-stone-900">{k.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}