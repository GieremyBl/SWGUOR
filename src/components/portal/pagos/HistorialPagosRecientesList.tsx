'use client';

import Link from 'next/link';
import { Eye, Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import { cn } from '@/lib/utils';
import { ESTADOS_PAGO } from '@/lib/constants/estados';
import {
  getMetodoPagoLabel,
  getTipoPagoLabel,
} from '@/lib/constants/portal-pago';
import type { MisPagosVista } from '@/lib/constants/portal-mis-pagos';
import { buildMisPagosPedidoDetalleUrl } from '@/lib/constants/portal-pedido-detalle';
import type { HistorialPagoTransaccion } from '@/lib/helpers/portal-historial-pagos.helper';
import {
  formatearFechaPortal,
  formatearMontoPortal,
} from '@/lib/helpers/pago-confirmacion.helper';
import type { HistorialPagoFila } from '@/lib/schemas/portal-historial-pagos';
import type { EstadoPago } from '@prisma/client';

interface Props {
  transacciones: HistorialPagoTransaccion[];
  filasPorPedido: Map<number, HistorialPagoFila>;
  loading: boolean;
  vista?: MisPagosVista;
  onVerComprobanteAbono?: (pedidoId: number, comprobanteId: string) => void;
}

function TransaccionCard({
  tx,
  detalleHref,
  onVerComprobanteAbono,
}: {
  tx: HistorialPagoTransaccion;
  detalleHref: string;
  onVerComprobanteAbono?: (comprobanteId: string) => void;
}) {
  const { abono } = tx;
  const estadoInfo =
    ESTADOS_PAGO[abono.estado as EstadoPago] ?? ESTADOS_PAGO.pendiente;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Transacción
              </p>
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border',
                  estadoInfo.bgColor,
                  estadoInfo.color,
                )}
              >
                {estadoInfo.label}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 tabular-nums">
              {formatearFechaPortal(abono.fecha_pago)}
            </p>
            <p className="text-2xl font-black text-[#231e1d] tabular-nums">
              {formatearMontoPortal(abono.monto, tx.moneda)}
            </p>
            <div className="text-xs text-slate-600 space-y-0.5">
              <p className="font-semibold">{getMetodoPagoLabel(abono.metodo_pago)}</p>
              <p className="text-slate-500">{getTipoPagoLabel(abono.tipo)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#e4c28a]/25 bg-[#fffdf8] px-4 py-3 min-w-[220px] space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#b5854b]/70">
              Pedido asociado
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-base text-[#231e1d]">{tx.codigo}</h3>
              <span className="text-xs text-slate-400">#{tx.pedido_id}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <EstadoBadge estado={tx.estado_pedido} tipo="pedido" />
            </div>
            <div className="text-xs text-slate-600 space-y-1 pt-1">
              <p>
                Total pedido:{' '}
                <span className="font-bold text-slate-800">
                  {formatearMontoPortal(tx.monto_total, tx.moneda)}
                </span>
              </p>
              <p>
                Pagado acumulado:{' '}
                <span className="font-bold text-emerald-700">
                  {formatearMontoPortal(tx.monto_pagado_pedido, tx.moneda)}
                </span>
              </p>
              {tx.saldo_pendiente > 0 && (
                <p>
                  Saldo pendiente:{' '}
                  <span className="font-bold text-amber-700">
                    {formatearMontoPortal(tx.saldo_pendiente, tx.moneda)}
                  </span>
                </p>
              )}
              <p className="text-slate-500">{tx.total_unidades} unidades</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-xs font-semibold border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
            asChild
          >
            <Link href={detalleHref}>
              <Eye className="size-3.5 mr-1.5 text-slate-600" />
              Detalle
            </Link>
          </Button>
          {abono.comprobante && onVerComprobanteAbono && (
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold bg-[#231e1d] text-[#e4c28a] hover:bg-[#2f2927]"
              onClick={() => onVerComprobanteAbono(abono.comprobante!.id)}
            >
              <Receipt className="size-3.5 mr-1.5" />
              Comprobante
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function HistorialPagosRecientesList({
  transacciones,
  filasPorPedido,
  loading,
  vista = 'historico',
  onVerComprobanteAbono,
}: Props) {
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#c4a35a]" size={32} />
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
          Cargando transacciones...
        </p>
      </div>
    );
  }

  if (transacciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
        <p className="font-bold text-slate-600 mb-2">Sin transacciones en el histórico</p>
        <p className="text-sm text-slate-400 max-w-sm">
          Cuando registres pagos en tus pedidos, aparecerán aquí ordenados del más reciente al más
          antiguo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transacciones.map((tx) => {
        const fila = filasPorPedido.get(tx.pedido_id);
        if (!fila) return null;

        return (
          <TransaccionCard
            key={tx.pago_id}
            tx={tx}
            detalleHref={buildMisPagosPedidoDetalleUrl(tx.pedido_id, vista)}
            onVerComprobanteAbono={
              onVerComprobanteAbono
                ? (comprobanteId) => onVerComprobanteAbono(tx.pedido_id, comprobanteId)
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
