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
      className="bg-guor-surface rounded-2xl overflow-hidden flex flex-col"
      style={{ border: '1px solid #e8d5a8', boxShadow: '0 1px 4px 0 rgb(26 20 16 / 0.06)' }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid #ede8e0' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#f5efe4', color: '#8a6d3b' }}
          >
            <Package size={15} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight" style={{ color: '#1a1410' }}>
              Mis Pedidos
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#b0a090' }}>
              Últimas actividades
            </p>
          </div>
        </div>
        <Link
          href="/portal/pedidos"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ background: '#f5efe4', color: '#8a6d3b' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = '#1a1410';
            (e.currentTarget as HTMLElement).style.color = '#fdf9f3';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = '#f5efe4';
            (e.currentTarget as HTMLElement).style.color = '#8a6d3b';
          }}
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
              className="flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{ color: 'inherit' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fdf9f3'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#f5efe4', color: '#8a6d3b' }}
              >
                <Package size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate" style={{ color: '#1a1410' }}>
                  Orden #{p.id}
                </p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#b0a090' }}>
                  {p.total_unidades} unid. · {formatCurrency(p.total)}
                </p>
              </div>
              <EstadoBadge estado={p.estado} tipo="pedido" />
            </Link>
          ))
        ) : (
          <div className="py-8 flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: '#f5efe4', color: '#d8d0c4' }}
            >
              <Package size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#b0a090' }}>
              Sin actividad
            </p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid #ede8e0' }}>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: '#b0a090' }}>
          Ayuda rápida
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              style={{ background: '#fdf9f3', color: '#8a6d3b', border: '1px solid #ede8e0' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#1a1410';
                (e.currentTarget as HTMLElement).style.color = '#fdf9f3';
                (e.currentTarget as HTMLElement).style.borderColor = '#1a1410';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '#fdf9f3';
                (e.currentTarget as HTMLElement).style.color = '#8a6d3b';
                (e.currentTarget as HTMLElement).style.borderColor = '#ede8e0';
              }}
            >
              <Icon size={13} /> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}