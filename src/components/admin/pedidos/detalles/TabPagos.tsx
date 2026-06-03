'use client';

import {
  CheckCircle2, AlertCircle, Receipt,
  CreditCard, DollarSign,
} from 'lucide-react';
import { COMPANY_PALETTE } from '@/components/admin/dashboards/widgets/DashboardUtils';
import { FinRow, SectionCard } from './PedidoDetalleUI';
import { fmt, METODO_PAGO_LABELS, type DetallePedidoData } from './types';

const G = COMPANY_PALETTE;

interface TabPagosProps {
  pedido: DetallePedidoData;
}

// ── Tarjeta de estado general ─────────────────────────────────────────────────

function EstadoPago({ pedido }: { pedido: DetallePedidoData }) {
  const saldoPendiente = pedido.saldo_pendiente ?? (pedido.total - pedido.monto_pagado);
  const pctPagado      = pedido.total > 0
    ? Math.min(100, Math.round((pedido.monto_pagado / pedido.total) * 100))
    : 0;
  const pagado         = saldoPendiente <= 0;

  return (
    <SectionCard title="Estado de Pago">
      {/* Badge de estado */}
      <div className="flex items-center justify-between mb-5 -mt-1">
        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          Avance de pago
        </span>
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
          pagado
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {pagado ? '✓ Pagado' : 'Pendiente'}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="mb-5">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
          <span className="text-stone-400">Completado</span>
          <span className="text-stone-700">{pctPagado}%</span>
        </div>
        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width:      `${pctPagado}%`,
              background: pagado ? '#10b981' : G.accent,
            }}
          />
        </div>
      </div>

      {/* 3 KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',  value: pedido.total,         icon: Receipt,      color: 'text-stone-900'  },
          { label: 'Pagado', value: pedido.monto_pagado,  icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Saldo',  value: saldoPendiente,       icon: AlertCircle,  color: pagado ? 'text-emerald-600' : 'text-amber-600' },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-stone-50 rounded-xl p-3 border border-stone-100 text-center"
          >
            <m.icon size={14} className={`${m.color} mx-auto mb-1`} />
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">
              {m.label}
            </p>
            <p className={`text-sm font-black ${m.color}`}>
              {fmt(m.value, pedido.moneda)}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ── Desglose financiero ───────────────────────────────────────────────────────

function DesglosePago({ pedido }: { pedido: DetallePedidoData }) {
  return (
    <SectionCard title="Desglose">
      <div className="divide-y divide-stone-50">
        <FinRow label="Subtotal"         value={pedido.subtotal}          moneda={pedido.moneda} />
        {pedido.monto_descuento > 0 && (
          <FinRow label="Descuento"      value={-pedido.monto_descuento}  moneda={pedido.moneda} />
        )}
        {pedido.costo_envio > 0 && (
          <FinRow label="Costo de envío" value={pedido.costo_envio}       moneda={pedido.moneda} />
        )}
        <FinRow label="IGV (18%)"        value={pedido.igv}               moneda={pedido.moneda} />
        <div className="pt-2">
          <FinRow label="TOTAL"          value={pedido.total}             moneda={pedido.moneda} accent large />
        </div>
      </div>
    </SectionCard>
  );
}

// ── Método de pago y moneda ───────────────────────────────────────────────────

function MetodoPago({ pedido }: { pedido: DetallePedidoData }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SectionCard>
        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
          Método de Pago
        </p>
        <div className="flex items-center gap-2">
          <CreditCard size={14} style={{ color: G.accent }} />
          <span className="text-sm font-black text-stone-900">
            {pedido.metodo_pago
              ? (METODO_PAGO_LABELS[pedido.metodo_pago] ?? pedido.metodo_pago)
              : 'No definido'}
          </span>
        </div>
      </SectionCard>

      <SectionCard>
        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
          Moneda
        </p>
        <div className="flex items-center gap-2">
          <DollarSign size={14} style={{ color: G.accent }} />
          <span className="text-sm font-black text-stone-900">{pedido.moneda}</span>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function TabPagos({ pedido }: TabPagosProps) {
  return (
    <div className="space-y-4">
      <EstadoPago   pedido={pedido} />
      <DesglosePago pedido={pedido} />
      <MetodoPago   pedido={pedido} />
    </div>
  );
}