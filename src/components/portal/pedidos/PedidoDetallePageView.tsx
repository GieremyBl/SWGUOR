'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Package, ShoppingBag } from 'lucide-react';
import { PedidoDetalleResumen } from '@/components/portal/pedidos/PedidoDetalleResumen';
import { PedidoDetalleTabs } from '@/components/portal/pedidos/PedidoDetalleTabs';
import type { PedidoConDetalles } from '@/components/portal/pedidos/PedidoModalDetalle';
import { cn } from '@/lib/utils';

interface Props {
  pedido: PedidoConDetalles | null;
  loading: boolean;
  error: string | null;
  backHref: string;
  backLabel: string;
  defaultTab?: 'resumen' | 'documentos' | 'asistencia';
  maxWidthClass?: string;
  showPagarButton?: boolean;
  onVerComprobante?: (pedidoId: number, comprobanteId: string) => void;
}

function buildPagoUrl(pedido: PedidoConDetalles): string {
  const saldo =
    Number(pedido.saldo_pendiente ?? 0) > 0
      ? Number(pedido.saldo_pendiente)
      : Math.max(Number(pedido.total ?? 0) - Number(pedido.monto_pagado ?? 0), 0);

  const params = new URLSearchParams({
    total: String(Number(pedido.total ?? 0)),
    saldo: String(saldo),
    cantidad: String(Number(pedido.total_unidades ?? 0)),
    nombre: `Pedido #${pedido.id}`,
    moneda: String(pedido.moneda ?? 'PEN'),
  });

  return `/portal/pago/${pedido.id}?${params.toString()}`;
}

export function PedidoDetallePageView({
  pedido,
  loading,
  error,
  backHref,
  backLabel,
  defaultTab = 'resumen',
  maxWidthClass = 'max-w-4xl',
  showPagarButton = true,
  onVerComprobante,
}: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#b5854b] mb-3" />
        <p className="text-sm font-medium">Cargando detalle del pedido...</p>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className={cn('mx-auto p-8 text-center space-y-4', maxWidthClass)}>
        <p className="text-red-600 font-semibold">{error ?? 'Pedido no disponible'}</p>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#b5854b] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      </div>
    );
  }

  const fechaFormateada = new Date(pedido.created_at).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const saldoPendiente = Number(pedido.saldo_pendiente ?? 0);
  const montoPagado = Number(pedido.monto_pagado ?? 0);
  const puedePagar = showPagarButton && saldoPendiente > 0;

  return (
    <div className={cn('flex flex-col gap-6 w-full mx-auto p-4 pb-12', maxWidthClass)}>
      <div className="flex flex-col gap-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#231e1d] w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#231e1d] text-[#e4c28a] shadow-lg">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#231e1d]">Pedido #{pedido.id}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Registrado el {fechaFormateada}</p>
            </div>
          </div>

          {puedePagar && (
            <button
              type="button"
              onClick={() => router.push(buildPagoUrl(pedido))}
              className="h-10 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] text-white shadow-md flex items-center gap-2 hover:opacity-90"
              style={{ backgroundColor: 'var(--guor-dark)' }}
            >
              <ShoppingBag size={14} style={{ color: 'var(--guor-gold)' }} />
              {montoPagado > 0 ? 'Abonar saldo' : 'Pagar pedido'}
            </button>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl border bg-white p-5 sm:p-6 lg:p-8 shadow-sm"
        style={{ borderColor: 'var(--guor-stone)' }}
      >
        <PedidoDetalleTabs
          pedidoId={pedido.id}
          defaultTab={defaultTab}
          resumen={
            <PedidoDetalleResumen pedido={pedido} onVerComprobante={onVerComprobante} />
          }
        />
      </div>
    </div>
  );
}
