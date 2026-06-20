'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { formatearSoles } from '@/lib/helpers/pago-parcial.helper';
import { toDatosPagadorCheckoutPayload } from '@/lib/helpers/datos-pagador-pago.helper';
import { redirigirTrasPagoExitoso } from '@/lib/helpers/checkout-redirect.helper';
import type { CheckoutGatewayPanelProps } from '@/components/portal/pagos/metodos-pagos/checkout-gateway.types';
import { BotonPagoAccion } from '@/components/portal/pagos/BotonPagoAccion';

interface StripeIntentData {
  client_secret: string;
  payment_intent_id: string;
  publishable_key: string;
}

function StripePaymentForm({
  pedidoId,
  email,
  montoSoles,
  datosPagador,
  paymentIntentId,
  disabled,
  onSuccess,
  onError,
}: CheckoutGatewayPanelProps & { paymentIntentId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [procesando, setProcesando] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async () => {
    if (!stripe || !elements || disabled || procesando || montoSoles <= 0) return;

    setProcesando(true);
    setLocalError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        const msg = error.message ?? 'No se pudo confirmar el pago';
        setLocalError(msg);
        onError?.(msg);
        return;
      }

      const intentId = paymentIntent?.id ?? paymentIntentId;

      const res = await fetch('/api/pagos/stripe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metodo_pago: 'stripe',
          pedido_id: pedidoId,
          email,
          payment_intent_id: intentId,
          monto_a_pagar: montoSoles,
          ...toDatosPagadorCheckoutPayload(datosPagador),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg = json.message ?? 'Error al registrar el pago';
        setLocalError(msg);
        onError?.(msg);
        return;
      }

      redirigirTrasPagoExitoso(json.data?.redirect_url);
      onSuccess?.();
    } catch {
      const msg = 'Error de conexión al procesar el pago';
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {localError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {localError}
        </p>
      )}

      <BotonPagoAccion
        onPagar={handleSubmit}
        procesando={procesando}
        deshabilitado={disabled || !stripe || !elements}
        montoSoles={montoSoles}
        pasarela="Stripe"
        tema="stripe"
      />
    </div>
  );
}

export function StripeCheckoutPanel(props: CheckoutGatewayPanelProps) {
  const { pedidoId, email, montoSoles, saldoPendiente, disabled } = props;
  const [intentData, setIntentData] = useState<StripeIntentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (montoSoles <= 0) {
      setIntentData(null);
      setError('');
      return;
    }

    let mounted = true;
    setLoading(true);
    setError('');

    fetch('/api/pagos/stripe/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metodo_pago: 'stripe',
        pedido_id: pedidoId,
        email,
        monto_a_pagar: montoSoles,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message ?? 'No se pudo iniciar Stripe');
        }
        return json.data as StripeIntentData;
      })
      .then((data) => {
        if (mounted) setIntentData(data);
      })
      .catch((err: Error) => {
        if (mounted) {
          setError(err.message);
          setIntentData(null);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [pedidoId, email, montoSoles]);

  const stripePromise = useMemo(
    () =>
      intentData?.publishable_key
        ? loadStripe(intentData.publishable_key)
        : null,
    [intentData?.publishable_key],
  );

  if (montoSoles <= 0) {
    return (
      <p className="text-sm text-slate-500 py-4 text-center">
        Ingresa un monto válido en el resumen de pago para cargar Stripe.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Preparando Stripe...
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 py-4 text-center">{error}</p>
    );
  }

  if (!intentData?.client_secret || !stripePromise) {
    return (
      <p className="text-sm text-slate-500 py-4 text-center">
        No se pudo preparar el formulario de Stripe.
      </p>
    );
  }
  console.log("Stripe Params -> Monto:", montoSoles, "ClientSecret:", intentData.client_secret);
  return (
    <div className="space-y-4">
      {disabled && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Complete los datos del pagador para habilitar el cobro con Stripe.
        </p>
      )}
      <div className="rounded-xl border border-[#635bff]/20 bg-[#f8f7ff] px-3.5 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#635bff]/70">
          Resumen Stripe
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Cargo hoy: <strong>{formatearSoles(montoSoles)}</strong>
          {' · '}
          Saldo del pedido: {formatearSoles(saldoPendiente)}
        </p>
      </div>

      <Elements
        key={`${intentData.payment_intent_id}-${montoSoles}`}
        stripe={stripePromise}
        options={{
          clientSecret: intentData.client_secret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#635bff',
              borderRadius: '12px',
            },
          },
        }}
      >
        <StripePaymentForm
          {...props}
          paymentIntentId={intentData.payment_intent_id}
        />
      </Elements>
    </div>
  );
}
