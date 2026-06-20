'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Eye,
  FileDown,
  Loader2,
  Receipt,
} from 'lucide-react';
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
import { formatDateLong } from '@/lib/helpers/format-helpers';
import {
  formatearFechaPortal,
  formatearMontoPortal,
} from '@/lib/helpers/pago-confirmacion.helper';
import type { HistorialPagoFila } from '@/lib/schemas/portal-historial-pagos';
import type { AbonoPedido } from '@/lib/schemas/portal-pedido-pagos';
import type { EstadoPago } from '@prisma/client';

interface Props {
  filas: HistorialPagoFila[];
  loading: boolean;
  vista?: MisPagosVista;
  onVerComprobante: (fila: HistorialPagoFila) => void;
  onVerComprobanteAbono?: (pedidoId: number, comprobanteId: string) => void;
}

function pagosEfectuados(abonos: AbonoPedido[]) {
  return abonos.filter((a) => a.estado === 'pagado');
}

function FilaAbono({
  abono,
  moneda,
  onVerComprobante,
}: {
  abono: AbonoPedido;
  moneda: string;
  onVerComprobante?: (comprobanteId: string) => void;
}) {
  const estadoInfo =
    ESTADOS_PAGO[abono.estado as EstadoPago] ?? ESTADOS_PAGO.pendiente;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 p-3.5 items-start sm:items-center border-b border-slate-100 last:border-b-0 bg-white">
      <div className="sm:col-span-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:hidden">
          Fecha
        </p>
        <p className="text-sm font-bold text-slate-800 tabular-nums">
          {formatearFechaPortal(abono.fecha_pago)}
        </p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:hidden">
          Monto
        </p>
        <p className="text-sm font-black text-[#231e1d] tabular-nums">
          {formatearMontoPortal(abono.monto, moneda)}
        </p>
      </div>
      <div className="sm:col-span-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:hidden">
          Método / tipo
        </p>
        <p className="text-xs font-semibold text-slate-700">
          {getMetodoPagoLabel(abono.metodo_pago)}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {getTipoPagoLabel(abono.tipo)}
        </p>
      </div>
      <div className="sm:col-span-2 flex sm:justify-center">
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
      <div className="sm:col-span-2 sm:text-right">
        {abono.comprobante?.numero_completo && (
          <p className="text-[11px] text-slate-500 mb-1 truncate">
            {abono.comprobante.numero_completo}
          </p>
        )}
        {abono.comprobante && onVerComprobante && (
          <button
            type="button"
            onClick={() => onVerComprobante(abono.comprobante!.id)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#b5854b] hover:text-[#231e1d] transition-colors"
          >
            <Receipt className="size-3.5" />
            Ver comprobante
          </button>
        )}
      </div>
    </div>
  );
}

function PedidoPagoAccordion({
  fila,
  expandido,
  onToggle,
  detalleHref,
  onVerComprobante,
  onVerComprobanteAbono,
}: {
  fila: HistorialPagoFila;
  expandido: boolean;
  onToggle: () => void;
  detalleHref: string;
  onVerComprobante: () => void;
  onVerComprobanteAbono?: (comprobanteId: string) => void;
}) {
  const efectuados = pagosEfectuados(fila.abonos ?? []);
  const puedeVerComprobante =
    Boolean(fila.comprobante?.id) &&
    (fila.estado_pago === 'pagado' || fila.estado_pago === 'parcial');

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-lg text-[#231e1d]">{fila.codigo}</h3>
              <span className="text-xs text-slate-400 font-medium">#{fila.pedido_id}</span>
            </div>
            <p className="text-sm text-slate-500">
              Último movimiento: {formatDateLong(fila.fecha)}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <EstadoBadge estado={fila.estado_pedido} tipo="pedido" />
              <EstadoBadge estado={fila.estado_pago} tipo="pago" />
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <p className="text-2xl font-black text-[#231e1d] tabular-nums">
              {formatearMontoPortal(fila.monto_total, fila.moneda)}
            </p>
            {fila.estado_pago !== 'pendiente' && (
              <p className="text-xs text-slate-500">
                Pagado:{' '}
                <span className="font-bold text-emerald-700">
                  {formatearMontoPortal(fila.monto_pagado, fila.moneda)}
                </span>
                {fila.saldo_pendiente > 0 && (
                  <>
                    {' '}
                    · Saldo:{' '}
                    <span className="font-bold text-amber-700">
                      {formatearMontoPortal(fila.saldo_pendiente, fila.moneda)}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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
          {puedeVerComprobante ? (
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold bg-[#231e1d] text-[#e4c28a] hover:bg-[#2f2927]"
              onClick={onVerComprobante}
            >
              <FileDown className="size-3.5 mr-1.5" />
              Comprobante
            </Button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expandido}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t text-left transition-colors',
          expandido
            ? 'bg-[#fffdf8] border-[#e4c28a]/40'
            : 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/80',
        )}
      >
        <span className="text-sm font-bold text-slate-700">
          {efectuados.length === 0
            ? 'Sin pagos efectuados registrados'
            : `${efectuados.length} pago${efectuados.length === 1 ? '' : 's'} efectuado${efectuados.length === 1 ? '' : 's'}`}
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-slate-500 transition-transform duration-200',
            expandido && 'rotate-180',
          )}
        />
      </button>

      {expandido && (
        <div className="border-t border-slate-100 bg-slate-50/40">
          {efectuados.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500 text-center">
              Aún no hay pagos confirmados para este pedido.
            </p>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-2.5 bg-slate-100/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="col-span-3">Fecha</div>
                <div className="col-span-2">Monto</div>
                <div className="col-span-3">Método / tipo</div>
                <div className="col-span-2 text-center">Estado</div>
                <div className="col-span-2 text-right">Comprobante</div>
              </div>
              <div className="divide-y divide-slate-100">
                {efectuados.map((abono) => (
                  <FilaAbono
                    key={abono.id}
                    abono={abono}
                    moneda={fila.moneda}
                    onVerComprobante={onVerComprobanteAbono}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}

export function HistorialPagosTable({
  filas,
  loading,
  vista = 'pedidos',
  onVerComprobante,
  onVerComprobanteAbono,
}: Props) {
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());

  const togglePedido = (pedidoId: number) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(pedidoId)) next.delete(pedidoId);
      else next.add(pedidoId);
      return next;
    });
  };

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

  if (filas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
        <p className="font-bold text-slate-600 mb-2">Sin transacciones registradas</p>
        <p className="text-sm text-slate-400 max-w-sm">
          Cuando realices pagos de tus pedidos, aparecerán aquí con su comprobante asociado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filas.map((fila) => (
        <PedidoPagoAccordion
          key={fila.pedido_id}
          fila={fila}
          expandido={expandidos.has(fila.pedido_id)}
          onToggle={() => togglePedido(fila.pedido_id)}
          detalleHref={buildMisPagosPedidoDetalleUrl(fila.pedido_id, vista)}
          onVerComprobante={() => onVerComprobante(fila)}
          onVerComprobanteAbono={
            onVerComprobanteAbono
              ? (comprobanteId) => onVerComprobanteAbono(fila.pedido_id, comprobanteId)
              : undefined
          }
        />
      ))}
    </div>
  );
}
