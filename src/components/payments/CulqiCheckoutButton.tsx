'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CULQI_CHARGE_API_DEFAULT,
  CULQI_DEFAULT_CURRENCY,
  type CulqiCurrencyCode,
} from '@/lib/constants/culqi';
import {
  buildCulqiCheckoutConfig,
  createCulqiCheckoutInstance,
  loadCulqiCheckoutScripts,
  mapCulqiUserMessage,
  parseCulqiCheckoutResult,
} from '@/lib/helpers/culqi-checkout.helper';
import { postCulqiCharge } from '@/lib/helpers/culqi-charge-client.helper';
import type { CulqiCheckoutPaymentMethods } from '@/types/culqi';

export interface CulqiCheckoutButtonProps {
  /** Monto en céntimos (Culqi) */
  amount: number;
  email: string;
  currency?: CulqiCurrencyCode;
  title?: string;
  orderId?: string;
  description?: string;
  /** Campos extra para el POST interno (ej. pedido_id) */
  chargePayload?: Record<string, unknown>;
  chargeEndpoint?: string;
  paymentMethods?: CulqiCheckoutPaymentMethods;
  paymentMethodsSort?: string[];
  disabled?: boolean;
  className?: string;
  buttonLabel?: string;
  onSuccess?: (data: unknown) => void;
  onError?: (message: string) => void;
}

export function CulqiCheckoutButton({
  amount,
  email,
  currency = CULQI_DEFAULT_CURRENCY,
  title,
  orderId,
  description,
  chargePayload,
  chargeEndpoint = CULQI_CHARGE_API_DEFAULT,
  paymentMethods,
  paymentMethodsSort,
  disabled = false,
  className,
  buttonLabel,
  onSuccess,
  onError,
}: CulqiCheckoutButtonProps) {
  const router = useRouter();
  const [isLoadingScripts, setIsLoadingScripts] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const checkoutRef = useRef<{ open: () => void; close: () => void } | null>(null);

  const isBusy = isLoadingScripts || isProcessing;
  const isDisabled = disabled || isBusy || amount <= 0 || !email.trim();

  const processCharge = useCallback(
    async (tokenId?: string, sourceId?: string) => {
      setIsProcessing(true);
      try {
        checkoutRef.current?.close();

        const result = await postCulqiCharge(
          {
            ...(tokenId ? { token: tokenId } : {}),
            ...(sourceId ? { source_id: sourceId } : {}),
            amount,
            currency_code: currency,
            email: email.trim(),
            ...(description ? { description } : {}),
            ...chargePayload,
          },
          chargeEndpoint,
        );

        if (!result.success) {
          const msg = result.message ?? 'Error al procesar el pago';
          toast.error(msg);
          onError?.(msg);
          return;
        }

        toast.success('Pago procesado correctamente');

        const redirectUrl =
          typeof result.data?.redirect_url === 'string'
            ? result.data.redirect_url
            : null;

        if (redirectUrl) {
          router.push(redirectUrl);
        }

        onSuccess?.(result.data);
      } catch {
        const msg = 'Error de conexión al procesar el pago';
        toast.error(msg);
        onError?.(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      amount,
      chargeEndpoint,
      chargePayload,
      currency,
      description,
      email,
      onError,
      onSuccess,
      router,
    ],
  );

  const openCheckout = useCallback(async () => {
    if (isDisabled || isBusy) return;

    setIsLoadingScripts(true);
    try {
      await loadCulqiCheckoutScripts();

      const config = buildCulqiCheckoutConfig({
        amount,
        email: email.trim(),
        currency,
        title,
        orderId,
        modal: true,
        paymentMethods,
        paymentMethodsSort,
      });

      const instance = createCulqiCheckoutInstance(config);

      instance.culqi = () => {
        const parsed = parseCulqiCheckoutResult(instance);

        if (parsed.errorMessage) {
          const msg = mapCulqiUserMessage(parsed.errorMessage, parsed.errorCode);
          toast.error(msg);
          onError?.(msg);
          return;
        }

        if (parsed.tokenId) {
          void processCharge(parsed.tokenId);
          return;
        }

        if (parsed.sourceId) {
          void processCharge(undefined, parsed.sourceId);
        }
      };

      checkoutRef.current = instance;
      instance.open();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo cargar la pasarela de pago';
      toast.error(msg);
      onError?.(msg);
    } finally {
      setIsLoadingScripts(false);
    }
  }, [
    amount,
    currency,
    email,
    isBusy,
    isDisabled,
    onError,
    orderId,
    paymentMethods,
    paymentMethodsSort,
    processCharge,
    title,
  ]);

  const label =
    buttonLabel ??
    `Pagar ${currency} ${(amount / 100).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
    })}`;

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        type="button"
        onClick={() => void openCheckout()}
        disabled={isDisabled}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Procesando pago...
          </>
        ) : isLoadingScripts ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Cargando pasarela...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {label}
          </>
        )}
      </Button>

      {isProcessing && (
        <p className="text-xs text-slate-500">
          No cierre esta ventana hasta confirmar el pago.
        </p>
      )}
    </div>
  );
}
