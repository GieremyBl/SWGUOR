'use client';

import Link from 'next/link';
import { ChevronRight, Hash, Mail, Package, Phone, ShoppingCart } from 'lucide-react';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import type { AdminPagoDetallePedido } from '@/lib/schemas/admin-pago-detalle';
import { cn } from '@/lib/utils';

interface Props {
  pedido: AdminPagoDetallePedido;
}

function formatMoney(value: number, moneda = 'PEN') {
  const symbol = moneda === 'PEN' ? 'S/' : moneda;
  return `${symbol} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PagoDetallePedidoSection({ pedido }: Props) {
  const pctPagado =
    pedido.total > 0 ? Math.min(100, (pedido.monto_pagado / pedido.total) * 100) : 0;

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Pedido asociado
          </p>
          <p className="text-lg font-black text-indigo-900 mt-0.5">#{pedido.id}</p>
          <p className="text-xs text-indigo-600/80 mt-0.5">
            Creado el {formatDate(pedido.created_at)} · {pedido.total_unidades} uds.
          </p>
        </div>
        <EstadoBadge estado={pedido.estado ?? 'pendiente'} tipo="pedido" />
      </div>

      {pedido.cliente && (
        <div className="rounded-lg bg-white/80 border border-indigo-100 p-3 space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cliente</p>
          <p className="text-sm font-bold text-slate-900">
            {pedido.cliente.razon_social ?? pedido.cliente.nombre_comercial ?? 'Sin nombre'}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {pedido.cliente.ruc && (
              <span className="inline-flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" />
                RUC {pedido.cliente.ruc}
              </span>
            )}
            {pedido.cliente.telefono && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {pedido.cliente.telefono}
              </span>
            )}
            {pedido.cliente.email && (
              <span className="inline-flex items-center gap-1 truncate max-w-full">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                {pedido.cliente.email}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Total', value: pedido.total, className: 'text-indigo-700' },
          { label: 'Pagado', value: pedido.monto_pagado, className: 'text-emerald-600' },
          { label: 'Pendiente', value: pedido.saldo_pendiente, className: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-white/80 border border-indigo-100 py-2 px-1">
            <p className={cn('text-base font-black tabular-nums', item.className)}>
              {formatMoney(item.value, pedido.moneda)}
            </p>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">{item.label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          <span>Progreso de pago</span>
          <span>{pctPagado.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white border border-indigo-100 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${pctPagado}%` }}
          />
        </div>
      </div>

      {pedido.items.length > 0 && (
        <div className="rounded-lg bg-white/80 border border-indigo-100 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider inline-flex items-center gap-1">
              <Package className="w-3 h-3" />
              Ítems del pedido
            </p>
            {pedido.items_count > pedido.items.length && (
              <span className="text-[10px] text-slate-400">
                +{pedido.items_count - pedido.items.length} más
              </span>
            )}
          </div>
          <ul className="space-y-1.5">
            {pedido.items.map((item, index) => (
              <li
                key={`${item.producto_sku ?? item.producto_nombre}-${index}`}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-slate-700 truncate">
                  {item.cantidad}× {item.producto_nombre}
                  {item.producto_sku ? ` (${item.producto_sku})` : ''}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                  {formatMoney(item.subtotal, pedido.moneda)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/admin/Panel-Administrativo/pedidos/${pedido.id}`}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-indigo-200 bg-white py-2.5 text-xs font-bold uppercase tracking-wider text-indigo-700 hover:bg-indigo-50 transition-colors"
      >
        <ShoppingCart className="w-4 h-4" />
        Ver pedido completo
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
