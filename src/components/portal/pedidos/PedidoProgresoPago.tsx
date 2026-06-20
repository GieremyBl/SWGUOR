'use client';

import { Wallet } from 'lucide-react';
import { formatearMontoPortal } from '@/lib/helpers/pago-confirmacion.helper';
import { resolverEstadoPagoHistorialPortal } from '@/lib/helpers/portal-historial-pagos.helper';

interface Props {
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  moneda?: string;
}

export function PedidoProgresoPago({
  total,
  montoPagado,
  saldoPendiente,
  moneda = 'PEN',
}: Props) {
  const totalSeguro = Math.max(Number(total) || 0, 0);
  const pagado = Math.max(Number(montoPagado) || 0, 0);
  const saldo = Math.max(Number(saldoPendiente) || 0, 0);
  const porcentaje =
    totalSeguro > 0 ? Math.min(100, Math.round((pagado / totalSeguro) * 100)) : 0;

  const estadoResumen = resolverEstadoPagoHistorialPortal(pagado, saldo);
  const etiquetaEstado =
    estadoResumen === 'pagado'
      ? 'Pedido cancelado'
      : estadoResumen === 'parcial'
        ? 'Pago parcial en curso'
        : 'Pendiente de pago';

  return (
    <div
      className="rounded-2xl border p-5 space-y-4 shadow-sm"
      style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl bg-white border"
            style={{ borderColor: 'var(--guor-stone)' }}
          >
            <Wallet size={16} style={{ color: 'var(--guor-gold)' }} />
          </div>
          <div>
            <p
              className="text-[9px] font-black uppercase tracking-widest opacity-50"
              style={{ color: 'var(--guor-dark)' }}
            >
              Progreso de pago
            </p>
            <p className="text-sm font-black mt-0.5" style={{ color: 'var(--guor-dark)' }}>
              {etiquetaEstado}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--guor-gold)' }}>
            {porcentaje}%
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">abonado</p>
        </div>
      </div>

      <div className="space-y-2">
        <div
          className="h-3 w-full rounded-full overflow-hidden bg-white border"
          style={{ borderColor: 'var(--guor-stone)' }}
          role="progressbar"
          aria-valuenow={porcentaje}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso de pago: ${porcentaje}%`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${porcentaje}%`,
              background: 'linear-gradient(90deg, var(--guor-gold) 0%, #e4c28a 100%)',
            }}
          />
        </div>
        <div
          className="flex justify-between text-[10px] font-bold opacity-70"
          style={{ color: 'var(--guor-dark)' }}
        >
          <span>Abonado: {formatearMontoPortal(pagado, moneda)}</span>
          <span>Total: {formatearMontoPortal(totalSeguro, moneda)}</span>
        </div>
      </div>

      {saldo > 0 && (
        <div
          className="rounded-xl border bg-white/80 px-4 py-3 text-center"
          style={{ borderColor: 'var(--guor-stone)' }}
        >
          <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">
            Saldo pendiente
          </p>
          <p className="text-lg font-black tabular-nums" style={{ color: 'var(--guor-dark)' }}>
            {formatearMontoPortal(saldo, moneda)}
          </p>
          <p className="text-[10px] opacity-50 mt-1">
            Te falta cancelar este monto para completar tu orden de producción.
          </p>
        </div>
      )}
    </div>
  );
}
