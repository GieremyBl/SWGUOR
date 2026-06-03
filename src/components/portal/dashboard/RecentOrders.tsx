'use client';

import Link from 'next/link';
import { Package, ChevronRight, UserCircle2, MapPin } from 'lucide-react';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import type { EstadoPedido } from '@prisma/client';

interface Pedido {
  id: number;
  estado: EstadoPedido;
  total: number;
  created_at: string;
  total_unidades: number;
  moneda: string;
}

interface RecentOrdersProps {
  pedidos: Pedido[];
}

const QUICK_LINKS = [
  { href: '/portal/perfil', label: 'Mi Perfil', icon: UserCircle2 },
  { href: '/portal/seguimiento-pedido', label: 'Tracking', icon: MapPin },
];

export function RecentOrders({ pedidos }: RecentOrdersProps) {
  return (
    <div
      className="bg-guor-surface rounded-2xl overflow-hidden flex flex-col border border-guor-line shadow-card"
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between border-b border-guor-line-soft"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-guor-cream-deep text-guor-soft"
          >
            <Package size={15} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-guor-ink">
              Mis Pedidos
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-widest text-guor-muted">
              Últimas actividades
            </p>
          </div>
        </div>
        <Link
          href="/portal/pedidos"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-guor-cream-deep text-guor-soft hover:bg-guor-dark hover:text-guor-bg"
        >
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Lista */}
      <div className="flex-1 p-3 space-y-1">
        {pedidos.length > 0 ? (
          pedidos.map((p) => (
            <Link
              key={p.id}
              href={`/portal/pedidos/${p.id}`}
              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-guor-bg text-inherit"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-guor-cream-deep text-guor-soft"
              >
                <Package size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate text-guor-ink">
                  Orden #{p.id}
                </p>
                <p className="text-[10px] font-semibold mt-0.5 text-guor-muted">
                  {p.total_unidades} unid. · {formatCurrency(p.total)}
                </p>
              </div>
              <EstadoBadge estado={p.estado} tipo="pedido" />
            </Link>
          ))
        ) : (
          <div className="py-8 flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-guor-cream-deep text-guor-stone-mid"
            >
              <Package size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-guor-muted">
              Sin actividad
            </p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="px-5 py-4 border-t border-guor-line-soft">
        <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-guor-muted">
          Ayuda rápida
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all bg-guor-bg text-guor-soft border border-guor-line-soft hover:bg-guor-dark hover:text-guor-bg hover:border-guor-dark"
            >
              <Icon size={13} /> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}