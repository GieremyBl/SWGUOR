'use client';

import { Calendar, CreditCard, ArrowUpRight, Clock, Layers, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EstadoBadge } from '@/components/portal/EstadoBadge';

type EstadoPedido = 'pendiente' | 'en_produccion' | 'listo_para_despacho' | 'entregado' | 'cancelado';
type EstadoPago   = 'pendiente' | 'verificado' | 'rechazado';

export interface Pedido {
  id: number; total: number; estado: EstadoPedido;
  estado_pago: EstadoPago; created_at: string;
  total_unidades: number; moneda: string;
}

const ESTADO_META = {
  pendiente:           { icon: Clock,        bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100'   },
  en_produccion:       { icon: Layers,       bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100'    },
  listo_para_despacho: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  entregado:           { icon: Truck,        bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-100'    },
  cancelado:           { icon: XCircle,      bg: 'bg-rose-50',    text: 'text-rose-500',    border: 'border-rose-100'    },
} as const;

const PAGO_META = {
  pendiente:  { label: 'Pago pendiente',  dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-600'   },
  verificado: { label: 'Pago verificado', dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  rechazado:  { label: 'Pago rechazado',  dot: 'bg-rose-400',    bg: 'bg-rose-50',    text: 'text-rose-500'    },
} as const;

interface Props {
  pedido:      Pedido;
  index:       number;
  onVerDetalle:(p: Pedido) => void;
  onPagar:     (p: Pedido) => void;
}

export function PedidoCard({ pedido, index, onVerDetalle, onPagar }: Props) {
  const estado    = ESTADO_META[pedido.estado] ?? ESTADO_META.pendiente;
  const pago      = PAGO_META[pedido.estado_pago] ?? PAGO_META.pendiente;
  const Icon      = estado.icon;
  const isPending = pedido.estado_pago === 'pendiente';

  const fecha = new Date(pedido.created_at).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const total = Number(pedido.total ?? 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-4 md:p-5 rounded-2xl border bg-white',
        'transition-all duration-200 hover:-translate-y-0.5',
        'hover:shadow-lg hover:shadow-[#b5854b]/8 hover:border-[#e4c28a]/50 border-[#e4c28a]/20',
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all group-hover:scale-105', estado.bg, estado.border)}>
        <Icon size={16} className={estado.text} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[#231e1d]">
          Pedido <span className="text-[#b5854b]">#{pedido.id}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Calendar size={10} className="text-[#b5854b]/40 flex-shrink-0" />
          <span className="text-[10px] font-medium text-[#231e1d]/35 truncate">{fecha}</span>
          {pedido.total_unidades > 0 && (
            <span className="text-[10px] font-medium text-[#231e1d]/25">
              · {pedido.total_unidades.toLocaleString()} und
            </span>
          )}
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end flex-shrink-0">
        <p className="text-[9px] font-bold text-[#b5854b]/40 uppercase tracking-widest mb-0.5">{pedido.moneda ?? 'PEN'}</p>
        <p className="text-base font-black text-[#231e1d] tabular-nums">{total}</p>
      </div>

      <div className="hidden md:block flex-shrink-0">
        <EstadoBadge estado={pedido.estado} tipo="pedido" />
      </div>

      <div className={cn('hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0 border', pago.bg)}
        style={{ borderColor: `${pago.dot}30` }}>
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', pago.dot)} />
        <span className={cn('text-[10px] font-bold', pago.text)}>{pago.label}</span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isPending && (
          <button
            onClick={(e) => { e.stopPropagation(); onPagar(pedido); }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#231e1d] hover:bg-[#b5854b] text-[#e4c28a] text-[10px] font-black uppercase tracking-wide transition-all hover:scale-105"
          >
            <CreditCard size={11} /> Pagar
          </button>
        )}
        <button
          onClick={() => onVerDetalle(pedido)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#e4c28a]/15 text-[#b5854b]/40 group-hover:bg-[#231e1d] group-hover:text-[#e4c28a] transition-all"
        >
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
}