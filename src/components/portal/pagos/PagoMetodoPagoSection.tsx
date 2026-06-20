'use client';

import dynamic from 'next/dynamic';
import { CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PAGO_GATEWAYS,
  type PagoGatewayId,
} from '@/lib/constants/pago-gateway';
import { CulqiCheckoutPanel } from '@/components/portal/pagos/metodos-pagos/CulqiCheckoutPanel';
import { StripeCheckoutPanel } from '@/components/portal/pagos/metodos-pagos/StripeCheckoutPanel';
import type { CheckoutGatewayPanelProps } from '@/components/portal/pagos/metodos-pagos/checkout-gateway.types';

const MercadoPagoCheckoutPanel = dynamic(
  () =>
    import('@/components/portal/pagos/metodos-pagos/MercadoPagoCheckoutPanel').then(
      (mod) => mod.MercadoPagoCheckoutPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando Mercado Pago...
      </div>
    ),
  },
);

interface Props extends CheckoutGatewayPanelProps {
  gateway: PagoGatewayId;
  onGatewayChange: (gateway: PagoGatewayId) => void;
  loadingPedido?: boolean;
  errorPedido?: string;
}

const GATEWAY_STYLES: Record<
  PagoGatewayId,
  { active: string; idle: string; accent: string }
> = {
  culqi: {
    active: 'border-[#231e1d] bg-[#231e1d] text-[#e4c28a] shadow-md',
    idle: 'border-slate-200 text-slate-500 hover:border-[#e4c28a]/40 bg-[#fffdf8]',
    accent: 'Culqi',
  },
  stripe: {
    active: 'border-[#635bff] bg-[#635bff] text-white shadow-md',
    idle: 'border-slate-200 text-slate-500 hover:border-[#635bff]/30 bg-[#fffdf8]',
    accent: 'Stripe',
  },
  mercadopago: {
    active: 'border-[#009ee3] bg-[#009ee3] text-white shadow-md',
    idle: 'border-slate-200 text-slate-500 hover:border-[#009ee3]/30 bg-[#fffdf8]',
    accent: 'Mercado Pago',
  },
};

function descripcionGatewayActivo(gateway: PagoGatewayId): string {
  switch (gateway) {
    case 'culqi':
      return 'Pago seguro con tarjeta vía Culqi (Perú).';
    case 'stripe':
      return 'Pago con tarjeta internacional vía Stripe.';
    case 'mercadopago':
      return 'Pago con tarjeta vía Mercado Pago Checkout API.';
    default:
      return 'Selecciona una pasarela de pago.';
  }
}

export function PagoMetodoPagoSection({
  gateway,
  onGatewayChange,
  loadingPedido,
  errorPedido,
  ...panelProps
}: Props) {
  const panelPropsCompletos: CheckoutGatewayPanelProps = panelProps;

  return (
    <div className="rounded-2xl border border-[#e4c28a]/20 bg-white p-6 shadow-sm shadow-[#231e1d]/5">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-[#231e1d] text-[#e4c28a]">
          <CreditCard size={18} />
        </div>
        <div>
          <h2 className="font-black text-lg text-[#231e1d]">Método de pago</h2>
          <p className="text-xs text-slate-500">{descripcionGatewayActivo(gateway)}</p>
        </div>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5"
        role="radiogroup"
        aria-label="Pasarela de pago"
      >
        {PAGO_GATEWAYS.map((item) => {
          const styles = GATEWAY_STYLES[item.id];
          const selected = gateway === item.id;

          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onGatewayChange(item.id)}
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

      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 md:p-5 min-h-[220px]">
        {loadingPedido ? (
          <div className="flex items-center justify-center py-10 text-slate-500 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando datos del pedido...
          </div>
        ) : errorPedido ? (
          <p className="text-sm text-red-600 py-4 text-center">{errorPedido}</p>
        ) : gateway === 'culqi' ? (
          <CulqiCheckoutPanel {...panelPropsCompletos} />
        ) : gateway === 'stripe' ? (
          <StripeCheckoutPanel {...panelPropsCompletos} />
        ) : (
          <MercadoPagoCheckoutPanel {...panelPropsCompletos} />
        )}
      </div>
    </div>
  );
}
