'use client';

import CheckoutImplement from '@/components/CheckoutImplement';
import { formatearSoles } from '@/lib/helpers/pago-parcial.helper';
import type { CheckoutGatewayPanelProps } from '@/components/portal/pagos/metodos-pagos/checkout-gateway.types';

export function CulqiCheckoutPanel({
  pedidoId,
  email,
  montoSoles,
  saldoPendiente,
  datosPagador,
  disabled,
  onSuccess,
  onError,
}: CheckoutGatewayPanelProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#e4c28a]/25 bg-[#fffdf8] px-3.5 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#b5854b]/70">
          Resumen Culqi
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Cargo hoy: <strong>{formatearSoles(montoSoles)}</strong>
          {' · '}
          Saldo del pedido: {formatearSoles(saldoPendiente)}
        </p>
      </div>

      <CheckoutImplement
        montoSoles={montoSoles}
        pedidoId={pedidoId}
        email={email}
        datosPagador={datosPagador}
        disabled={disabled}
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  );
}
