'use client';

import { CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getPagoGatewaysVisibles,
  PAGO_GATEWAY_ACTIVO,
  type PagoGatewayId,
} from '@/lib/constants/pago-gateway';
import { StripeCheckoutPanel } from '@/components/portal/pago/StripeCheckoutPanel';
import type { CheckoutGatewayPanelProps } from '@/components/portal/pago/checkout-gateway.types';

interface Props extends CheckoutGatewayPanelProps {
  gateway?: PagoGatewayId;
  onGatewayChange?: (gateway: PagoGatewayId) => void;
  loadingPedido?: boolean;
  errorPedido?: string;
}

const GATEWAY_STYLES: Record<
  PagoGatewayId,
  { active: string; idle: string }
> = {
  culqi: {
    active: 'border-[#231e1d] bg-[#231e1d] text-[#e4c28a] shadow-md',
    idle: 'border-slate-200 text-slate-500 hover:border-[#e4c28a]/40 bg-[#fffdf8]',
  },
  stripe: {
    active: 'border-[#635bff] bg-[#635bff] text-white shadow-md',
    idle: 'border-slate-200 text-slate-500 hover:border-[#635bff]/30 bg-[#fffdf8]',
  },
  mercadopago: {
    active: 'border-[#009ee3] bg-[#009ee3] text-white shadow-md',
    idle: 'border-slate-200 text-slate-500 hover:border-[#009ee3]/30 bg-[#fffdf8]',
  },
};

function descripcionGatewayActivo(gateway: PagoGatewayId): string {
  switch (gateway) {
    case 'stripe':
      return 'Pago con tarjeta vía Stripe.';
    case 'culqi':
      return 'Pago seguro con tarjeta vía Culqi (Perú).';
    case 'mercadopago':
      return 'Pago con tarjeta vía Mercado Pago Checkout API.';
    default:
      return 'Selecciona una pasarela de pago.';
  }
}

export function PagoMetodoPagoSection({
  gateway = PAGO_GATEWAY_ACTIVO,
  onGatewayChange,
  loadingPedido,
  errorPedido,
  ...panelProps
}: Props) {
  const gatewaysVisibles = getPagoGatewaysVisibles();
  const mostrarSelector = gatewaysVisibles.length > 1;
  const gatewayActivo = gatewaysVisibles.some((item) => item.id === gateway)
    ? gateway
    : PAGO_GATEWAY_ACTIVO;

  return (
    <div className="rounded-2xl border border-[#e4c28a]/20 bg-white p-6 shadow-sm shadow-[#231e1d]/5">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-[#231e1d] text-[#e4c28a]">
          <CreditCard size={18} />
        </div>
        <div>
          <h2 className="font-black text-lg text-[#231e1d]">Método de pago</h2>
          <p className="text-xs text-slate-500">
            {descripcionGatewayActivo(gatewayActivo)}
          </p>
        </div>
      </div>

      {mostrarSelector && (
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5"
          role="radiogroup"
          aria-label="Pasarela de pago"
        >
          {gatewaysVisibles.map((item) => {
            const styles = GATEWAY_STYLES[item.id];
            const selected = gatewayActivo === item.id;

            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onGatewayChange?.(item.id)}
                className={cn(
                  'flex flex-col items-start gap-1 p-3.5 rounded-xl border-2 text-left transition-all',
                  selected ? styles.active : styles.idle,
                )}
              >
                <span className="text-xs font-black uppercase tracking-wide">
                  {item.label}
                </span>
                <span
                  className={cn(
                    'text-[10px] leading-snug',
                    selected ? 'opacity-90' : 'opacity-60',
                  )}
                >
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 md:p-5 min-h-[220px]">
        {loadingPedido ? (
          <div className="flex items-center justify-center py-10 text-slate-500 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando datos del pedido...
          </div>
        ) : errorPedido ? (
          <p className="text-sm text-red-600 py-4 text-center">{errorPedido}</p>
        ) : (
          <StripeCheckoutPanel {...panelProps} />
        )}
      </div>
    </div>
  );
}
