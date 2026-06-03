'use client';

import Link from 'next/link';
import { ChevronRight, Hash, Phone, Mail } from 'lucide-react';
import { COMPANY_PALETTE } from '@/components/admin/dashboards/widgets/DashboardUtils';
import { FinRow, SectionCard } from './PedidoDetalleUI';
import { type DetallePedidoData } from './types';

const G = COMPANY_PALETTE;

interface PedidoDetalleSidebarProps {
  pedido: DetallePedidoData;
}

export function PedidoDetalleSidebar({ pedido }: PedidoDetalleSidebarProps) {
  const pctPagado = pedido.total > 0
    ? Math.min(100, (pedido.monto_pagado / pedido.total) * 100)
    : 0;
  const saldado = pedido.saldo_pendiente <= 0;

  return (
    <div className="space-y-4">

      {/* ── Cliente ───────────────────────────────────────────────────────── */}
      <SectionCard title="Cliente">
        {pedido.clientes ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-black text-stone-900 leading-tight">
                {pedido.clientes.razon_social}
              </p>
              {pedido.clientes.nombre_comercial && (
                <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                  {pedido.clientes.nombre_comercial}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-50">
              {pedido.clientes.ruc && (
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Hash size={12} className="text-stone-400 flex-shrink-0" />
                  <span className="font-medium">RUC: {pedido.clientes.ruc}</span>
                </div>
              )}
              {pedido.clientes.telefono && (
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Phone size={12} className="text-stone-400 flex-shrink-0" />
                  <span>{pedido.clientes.telefono}</span>
                </div>
              )}
              {pedido.clientes.email && (
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Mail size={12} className="text-stone-400 flex-shrink-0" />
                  <span className="truncate">{pedido.clientes.email}</span>
                </div>
              )}
            </div>

            <Link
              href={`/admin/Panel-Administrativo/clientes/${pedido.clientes.id}`}
              className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-widest transition-colors hover:opacity-70"
              style={{ color: G.accent }}
            >
              Ver perfil <ChevronRight size={12} />
            </Link>
          </div>
        ) : (
          <p className="text-xs text-stone-400 font-bold">Sin cliente asignado</p>
        )}
      </SectionCard>

      {/* ── Resumen financiero ────────────────────────────────────────────── */}
      <SectionCard title="Resumen Financiero">
        <div className="divide-y divide-stone-50">
          <FinRow label="Total"  value={pedido.total}         moneda={pedido.moneda} />
          <FinRow label="Pagado" value={pedido.monto_pagado}  moneda={pedido.moneda} />
          <FinRow
            label="Saldo"
            value={pedido.saldo_pendiente}
            moneda={pedido.moneda}
            accent={!saldado}
          />
        </div>

        {/* Barra de progreso de pago */}
        <div className="mt-3 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width:      `${pctPagado}%`,
              background: saldado ? '#10b981' : G.accent,
            }}
          />
        </div>
      </SectionCard>

      {/* ── Notas ────────────────────────────────────────────────────────── */}
      {(pedido.notas_cliente || pedido.notas_pedido) && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3">
            Notas
          </h3>
          {pedido.notas_cliente && (
            <div className="mb-3">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">
                Del cliente
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">{pedido.notas_cliente}</p>
            </div>
          )}
          {pedido.notas_pedido && (
            <div>
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">
                Internas
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">{pedido.notas_pedido}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}