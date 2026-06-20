'use client';

import { CulqiCheckoutButton } from '@/components/payments/CulqiCheckoutButton';
import { toCulqiAmountCents } from '@/lib/constants/culqi';
import { toDatosPagadorCheckoutPayload } from '@/lib/helpers/datos-pagador-pago.helper';
import { formatearSoles } from '@/lib/helpers/pago-parcial.helper';
import type { DatosPagadorPago } from '@/lib/schemas/datos-pagador-pago';

type CheckoutImplementProps = {
  /** Monto a cobrar hoy en soles */
  montoSoles: number;
  pedidoId: number;
  email?: string;
  datosPagador: DatosPagadorPago;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const CheckoutImplement = ({
  montoSoles,
  pedidoId,
  email = 'cliente@guor.com',
  datosPagador,
  disabled = false,
  onSuccess,
  onError,
}: CheckoutImplementProps) => {
  const amountCents = toCulqiAmountCents(montoSoles);
  const labelMonto = formatearSoles(montoSoles);

  return (
    <div className="space-y-3.5">
      <div className="rounded-xl border border-[#e4c28a]/30 bg-white px-3.5 py-3">
        <p className="text-sm font-semibold text-[#425f7c]">
          Completa tu pago de forma segura con Culqi.
        </p>
        <p className="text-xs text-[#6e8bab] mt-1">
          Monto a procesar hoy: {labelMonto}
        </p>
      </div>

      <CulqiCheckoutButton
        amount={amountCents}
        email={email}
        orderId={String(pedidoId)}
        title={`Pedido #${pedidoId}`}
        chargePayload={{
          metodo_pago: 'culqi',
          pedido_id: pedidoId,
          monto_a_pagar: montoSoles,
          ...toDatosPagadorCheckoutPayload(datosPagador),
        }}
        buttonLabel={`Pagar ${labelMonto}`}
        disabled={disabled || montoSoles <= 0}
        onSuccess={() => onSuccess?.()}
        onError={onError}
        className="[&_button]:h-12 [&_button]:rounded-xl [&_button]:bg-[#231e1d] [&_button]:text-[#e4c28a] [&_button]:font-black [&_button]:tracking-wide [&_button]:hover:bg-[#2f2927] [&_button]:disabled:bg-[#9b9b9f] [&_button]:disabled:text-[#ece0c9]"
      />
    </div>
  );
};

export default CheckoutImplement;
