'use client';

import { X, Package, ShoppingBag } from 'lucide-react';
import { Pedido } from './PedidoCard';
import { PedidoDetalleResumen } from './PedidoDetalleResumen';
import { PedidoDetalleTabs } from './PedidoDetalleTabs';

export interface PedidoConDetalles extends Pedido {
  direccion_envio?: string | null;
  notas?: string | null;
}

interface PedidoModalDetalleProps {
  pedido: PedidoConDetalles | null;
  isOpen: boolean;
  onClose: () => void;
  onPagar?: (pedido: Pedido) => void;
  onVerComprobante?: (pedidoId: number, comprobanteId: string) => void;
}

export function PedidoModalDetalle({
  pedido,
  isOpen,
  onClose,
  onPagar,
  onVerComprobante,
}: PedidoModalDetalleProps) {
  if (!isOpen || !pedido) return null;

  const montoPagado = Number(pedido.monto_pagado ?? 0);
  const saldoPendiente = Number(
    pedido.saldo_pendiente ?? Math.max(pedido.total - montoPagado, 0),
  );
  const tieneSaldoPendiente = saldoPendiente > 0;

  const fechaFormateada = new Date(pedido.created_at).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col border animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]"
        style={{ borderColor: 'var(--guor-stone)' }}
      >
        <div
          className="p-5 border-b flex justify-between items-center bg-neutral-50 shrink-0"
          style={{ borderColor: 'var(--guor-stone)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white border" style={{ borderColor: 'var(--guor-stone)' }}>
              <Package size={15} style={{ color: 'var(--guor-gold)' }} />
            </div>
            <div>
              <h3
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: 'var(--guor-dark)' }}
              >
                Detalle del Pedido #{pedido.id}
              </h3>
              <p className="text-[10px] font-medium opacity-50 mt-0.5" style={{ color: 'var(--guor-dark)' }}>
                Registrado el {fechaFormateada}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="opacity-40 hover:opacity-100 transition-opacity p-1.5 rounded-lg border bg-white hover:bg-neutral-50"
            style={{ color: 'var(--guor-dark)', borderColor: 'var(--guor-stone)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <PedidoDetalleTabs
            pedidoId={pedido.id}
            resumen={
              <PedidoDetalleResumen pedido={pedido} onVerComprobante={onVerComprobante} />
            }
          />
        </div>

        <div
          className="p-4 border-t bg-neutral-50 flex justify-end gap-3 shrink-0"
          style={{ borderColor: 'var(--guor-stone)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] border bg-white hover:bg-neutral-50 transition-colors"
            style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
          >
            Cerrar
          </button>

          {tieneSaldoPendiente && onPagar && (
            <button
              type="button"
              onClick={() => {
                onPagar({
                  ...pedido,
                  monto_pagado: montoPagado,
                  saldo_pendiente: saldoPendiente,
                });
                onClose();
              }}
              className="h-10 px-5 rounded-xl font-black uppercase tracking-widest text-white shadow-md transition-all active:scale-[0.97] flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--guor-dark)' }}
            >
              <ShoppingBag size={13} style={{ color: 'var(--guor-gold)' }} />
              {montoPagado > 0 ? 'Abonar saldo' : 'Pagar pedido'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
