'use client';

import { FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ESTADOS_PAGO } from '@/lib/constants/estados';
import {
  getMetodoPagoLabel,
  getTipoPagoLabel,
} from '@/lib/constants/portal-pago';
import { formatearFechaPortal, formatearMontoPortal } from '@/lib/helpers/pago-confirmacion.helper';
import type { AbonoPedido } from '@/lib/schemas/portal-pedido-pagos';
import type { EstadoPago } from '@prisma/client';

interface Props {
  abonos: AbonoPedido[];
  loading: boolean;
  error: string | null;
  moneda?: string;
  onVerComprobante?: (abono: AbonoPedido) => void;
}

export function PedidoHistorialAbonos({
  abonos,
  loading,
  error,
  moneda = 'PEN',
  onVerComprobante,
}: Props) {
  return (
    <div className="space-y-2">
      <span
        className="text-[9px] font-black uppercase tracking-widest opacity-50 block"
        style={{ color: 'var(--guor-dark)' }}
      >
        Historial de pagos del pedido
        {abonos.length > 0 && (
          <span className="ml-1 normal-case tracking-normal font-bold opacity-70">
            ({abonos.filter((a) => a.estado === 'pagado').length} efectuados)
          </span>
        )}
      </span>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 rounded-xl border border-dashed border-neutral-200">
          <Loader2 className="animate-spin text-[#c4a35a]" size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Cargando abonos...
          </span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
          {error}
        </div>
      ) : abonos.length === 0 ? (
        <div
          className="rounded-xl border border-dashed px-4 py-8 text-center"
          style={{ borderColor: 'var(--guor-stone)', backgroundColor: 'var(--guor-cream)' }}
        >
          <p className="text-[11px] font-bold opacity-60" style={{ color: 'var(--guor-dark)' }}>
            Aún no hay abonos registrados para este pedido.
          </p>
          <p className="text-[10px] opacity-40 mt-1" style={{ color: 'var(--guor-dark)' }}>
            Tus pagos parciales o totales aparecerán aquí con fecha y estado.
          </p>
        </div>
      ) : (
        <div
          className="border rounded-xl overflow-hidden bg-white"
          style={{ borderColor: 'var(--guor-stone)' }}
        >
          <div
            className="grid grid-cols-12 bg-neutral-50 p-2.5 border-b font-black text-[9px] uppercase tracking-widest opacity-60"
            style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
          >
            <div className="col-span-4">Fecha</div>
            <div className="col-span-2 text-right">Monto</div>
            <div className="col-span-3">Método / tipo</div>
            <div className="col-span-3 text-center">Estado</div>
          </div>

          <div className="divide-y divide-neutral-100 max-h-56 overflow-y-auto">
            {abonos.map((abono) => (
              <div
                key={abono.id}
                className="grid grid-cols-12 p-3 items-center gap-2 font-medium"
                style={{ color: 'var(--guor-dark)' }}
              >
                <div className="col-span-4">
                  <p className="text-[11px] font-bold tabular-nums">
                    {formatearFechaPortal(abono.fecha_pago)}
                  </p>
                  {abono.comprobante?.numero_completo && (
                    <p className="text-[9px] opacity-40 mt-0.5 truncate">
                      {abono.comprobante.numero_completo}
                    </p>
                  )}
                </div>
                <div className="col-span-2 text-right font-black tabular-nums text-[11px]">
                  {formatearMontoPortal(abono.monto, moneda)}
                </div>
                <div className="col-span-3">
                  <p className="text-[10px] font-semibold opacity-80">
                    {getMetodoPagoLabel(abono.metodo_pago)}
                  </p>
                  <p className="text-[9px] opacity-50 mt-0.5">
                    {getTipoPagoLabel(abono.tipo)}
                  </p>
                </div>
                <div className="col-span-3 flex flex-col items-center gap-1.5">
                  {(() => {
                    const info =
                      ESTADOS_PAGO[abono.estado as EstadoPago] ??
                      ESTADOS_PAGO.pendiente;
                    return (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border',
                          info.bgColor,
                          info.color,
                        )}
                      >
                        {info.label}
                      </span>
                    );
                  })()}
                  {abono.comprobante && onVerComprobante && (
                    <button
                      type="button"
                      onClick={() => onVerComprobante(abono)}
                      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <FileText size={10} />
                      Ver recibo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
