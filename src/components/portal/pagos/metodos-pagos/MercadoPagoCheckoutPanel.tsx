'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import { Loader2 } from 'lucide-react';
import { getMercadoPagoPublicKeyEnv } from '@/lib/constants/mercadopago';
import { formatearSoles } from '@/lib/helpers/pago-parcial.helper';
import { toDatosPagadorCheckoutPayload } from '@/lib/helpers/datos-pagador-pago.helper';
import { redirigirTrasPagoExitoso } from '@/lib/helpers/checkout-redirect.helper';
import type { CheckoutGatewayPanelProps } from '@/components/portal/pagos/checkout-gateway.types';
import { BotonPagoAccion } from '@/components/portal/pagos/BotonPagoAccion';
import type { MercadoPagoCardFormData } from '@/types/mercadopago-brick';
import { cn } from '@/lib/utils';

const MP_PUBLIC_KEY = getMercadoPagoPublicKeyEnv();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MP_BRICK_WRAPPER_ID = 'mp-payment-brick-wrapper';
const MP_CARD_PAYMENT_ID = 'mp-card-payment-brick-container';

let mercadoPagoSdkInicializado = false;

function normalizarFormDataTarjeta(
  payload: MercadoPagoCardFormData | { formData: MercadoPagoCardFormData },
): MercadoPagoCardFormData {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'formData' in payload &&
    payload.formData
  ) {
    return payload.formData;
  }
  return payload as MercadoPagoCardFormData;
}

function esEmailValido(valor: string): boolean {
  return EMAIL_REGEX.test(valor.trim());
}

export function MercadoPagoCheckoutPanel({
  pedidoId,
  email,
  montoSoles,
  saldoPendiente,
  datosPagador,
  disabled,
  onSuccess,
  onError,
}: CheckoutGatewayPanelProps) {
  const emailInicial = email?.trim() ?? '';
  const [isMounted, setIsMounted] = useState(false);
  const [localEmail, setLocalEmail] = useState(emailInicial);
  const [emailConfirmado, setEmailConfirmado] = useState(Boolean(emailInicial));
  const [emailError, setEmailError] = useState('');
  const [sdkListo, setSdkListo] = useState(false);
  const [brickListo, setBrickListo] = useState(false);
  const [brickError, setBrickError] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorConfig, setErrorConfig] = useState('');

  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const montoNumerico = useMemo(
    () => Math.round(Number(montoSoles) * 100) / 100,
    [montoSoles],
  );

  const emailPago = useMemo(() => localEmail.trim(), [localEmail]);

  const brickInstanceKey = useMemo(
    () => `mp-payment-${pedidoId}-${montoNumerico}-${emailPago}`,
    [pedidoId, montoNumerico, emailPago],
  );

  const brickPayer = useMemo(
    () => ({ email: emailPago }),
    [emailPago],
  );

  const brickInitialization = useMemo(
    () => ({
      amount: montoNumerico,
      payer: brickPayer,
    }),
    [montoNumerico, brickPayer],
  );

  const brickCustomization = useMemo(
    () => ({
      visual: {
        hidePaymentButton: true,
        style: {
          theme: 'default' as const,
        },
      },
      paymentMethods: {
        maxInstallments: 1,
      },
    }),
    [],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !emailConfirmado) {
      setSdkListo(false);
      return;
    }

    if (!MP_PUBLIC_KEY) {
      setErrorConfig('NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no está configurada');
      setSdkListo(false);
      return;
    }

    if (!mercadoPagoSdkInicializado) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' });
      mercadoPagoSdkInicializado = true;
    }

    setErrorConfig('');
    setSdkListo(true);
  }, [isMounted, emailConfirmado]);

  const handleBrickReady = useCallback(() => {
    setBrickListo(true);
    setBrickError('');
  }, []);

  const handleBrickError = useCallback((brickErrorPayload: { message?: string }) => {
    setBrickListo(false);
    const msg =
      typeof brickErrorPayload?.message === 'string'
        ? brickErrorPayload.message
        : 'Error al cargar el formulario de Mercado Pago';
    setBrickError(msg);
    onErrorRef.current?.(msg);
  }, []);

  const handleBrickSubmit = useCallback(async () => {
    // Con hidePaymentButton el cobro se dispara desde BotonPagoAccion.
  }, []);

  const handleConfirmarEmail = () => {
    const valor = localEmail.trim();

    if (!esEmailValido(valor)) {
      setEmailError('Ingresa un correo electrónico válido');
      return;
    }

    setEmailError('');
    setLocalEmail(valor);
    setEmailConfirmado(true);
  };

  const procesarCargo = useCallback(
    async (formData: MercadoPagoCardFormData) => {
      const token = formData.token?.trim();
      const paymentMethodId = formData.payment_method_id?.trim();

      if (!token || !paymentMethodId) {
        onErrorRef.current?.('Datos de tarjeta incompletos');
        return;
      }

      const res = await fetch('/api/pagos/mercadopago/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: pedidoId,
          email: emailPago,
          token,
          payment_method_id: paymentMethodId,
          installments: formData.installments ?? 1,
          issuer_id: formData.issuer_id,
          monto_a_pagar: montoNumerico,
          ...toDatosPagadorCheckoutPayload(datosPagador),
        }),
      });

      const json = await res.json();

      if (res.status === 202) {
        onErrorRef.current?.(json.message ?? 'Pago en proceso de validación');
        return;
      }

      if (!res.ok || !json.success) {
        onErrorRef.current?.(json.message ?? 'No se pudo procesar el pago');
        return;
      }

      redirigirTrasPagoExitoso(json.data?.redirect_url);
      onSuccessRef.current?.();
    },
    [pedidoId, emailPago, montoNumerico, datosPagador],
  );

  const handleSubmit = useCallback(async () => {
    if (disabled || procesando || montoNumerico <= 0 || !brickListo) return;

    const controller = window.cardPaymentBrickController;
    if (!controller?.getFormData) {
      onErrorRef.current?.('El formulario de tarjeta aún no está listo');
      return;
    }

    setProcesando(true);
    try {
      const payload = await controller.getFormData();
      await procesarCargo(normalizarFormDataTarjeta(payload));
    } catch {
      onErrorRef.current?.('Revisa los datos de la tarjeta e intenta de nuevo');
    } finally {
      setProcesando(false);
    }
  }, [brickListo, disabled, montoNumerico, procesando, procesarCargo]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Preparando checkout...
      </div>
    );
  }

  if (errorConfig) {
    return (
      <p className="text-sm text-red-600 py-4 text-center">{errorConfig}</p>
    );
  }

  if (montoNumerico <= 0) {
    return (
      <p className="text-sm text-slate-500 py-4 text-center">
        Ingresa un monto válido en el resumen de pago para cargar Mercado Pago.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {disabled && emailConfirmado && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Complete los datos del pagador para habilitar el cobro con Mercado Pago.
        </p>
      )}
      <div className="rounded-xl border border-[#009ee3]/25 bg-[#f0f9ff] px-3.5 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#009ee3]/80">
          Resumen Mercado Pago
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Cargo hoy: <strong>{formatearSoles(montoNumerico)}</strong>
          {' · '}
          Saldo del pedido: {formatearSoles(saldoPendiente)}
        </p>
      </div>

      {!emailConfirmado ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <label
            htmlFor="mp-checkout-email"
            className="block text-sm font-semibold text-slate-700"
          >
            Correo Electrónico
          </label>
          <input
            id="mp-checkout-email"
            type="email"
            value={localEmail}
            onChange={(e) => {
              setLocalEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            placeholder="tu@correo.com"
            className={cn(
              'w-full h-11 px-4 rounded-xl border text-sm text-slate-800',
              'focus:outline-none focus:ring-2 focus:ring-[#009ee3]/30 focus:border-[#009ee3]',
              emailError ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white',
            )}
          />
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
          <button
            type="button"
            onClick={handleConfirmarEmail}
            className="w-full h-11 rounded-xl bg-[#009ee3] hover:bg-[#008ecf] text-white text-sm font-bold transition-colors"
          >
            Confirmar
          </button>
        </div>
      ) : !sdkListo ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando Mercado Pago...
        </div>
      ) : (
        <div id={MP_BRICK_WRAPPER_ID} key={brickInstanceKey}>
          <CardPayment
            id={MP_CARD_PAYMENT_ID}
            initialization={brickInitialization}
            customization={brickCustomization}
            locale="es-PE"
            onReady={handleBrickReady}
            onError={handleBrickError}
            onSubmit={handleBrickSubmit}
          />
          {brickError && (
            <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {brickError}
            </p>
          )}
        </div>
      )}

      {emailConfirmado && (
        <BotonPagoAccion
          onPagar={handleSubmit}
          procesando={procesando}
          deshabilitado={disabled || !brickListo || Boolean(brickError)}
          montoSoles={montoNumerico}
          pasarela="Mercado Pago"
          tema="mercadopago"
        />
      )}
    </div>
  );
}
