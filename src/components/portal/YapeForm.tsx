'use client';

import { useEffect, useState } from 'react';
import { formatearSoles } from '@/lib/helpers/pago-parcial.helper';

declare global {
  interface Window {
    culqi?: () => void;
  }
}

interface YapeFormProps {
  amount: number;
  montoSoles: number;
  pedidoId: number;
  email: string;
  orderId: string;
  disabled?: boolean;
  onSuccess?: (chargeId: string) => void;
  onError?: (msg: string) => void;
}

export default function YapeForm({
  amount,
  montoSoles,
  pedidoId,
  email,
  orderId,
  disabled = false,
  onSuccess,
  onError,
}: YapeFormProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!window.Culqi) return;

    window.Culqi.settings({
      currency: 'PEN',
      amount,
      order: orderId,
    });
  }, [amount, orderId]);

  useEffect(() => {
    window.culqi = () => {
      // Agregamos la validación para asegurar que window.Culqi existe dentro del callback
      if (!window.Culqi) return;

      if (window.Culqi.token) {
        void handleCharge(window.Culqi.token.id);
      } else if (window.Culqi.error) {
        const msg = window.Culqi.error.user_message;
        setError(msg);
        onError?.(msg);
      }
    };
    // Es buena práctica limpiar el evento cuando el componente se desmonte
    return () => {
      window.culqi = undefined;
    };
  }, [pedidoId, email, montoSoles, onSuccess, onError]); // Añadidas dependencias faltantes

  const handleCharge = async (tokenId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/culqi/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenId,
          pedido_id: pedidoId,
          email,
          monto_a_pagar: montoSoles,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess?.(data.data?.culqi_charge_id ?? '');
      } else {
        const msg = data.message || data.error || 'Error al procesar el pago';
        setError(msg);
        onError?.(msg);
      }
    } catch {
      const msg = 'Error de conexión. Intenta nuevamente.';
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async () => {
    if (disabled) return;
    if (!phone || !code) {
      setError('Ingresa tu número y código de aprobación');
      return;
    }
    // Verificación de seguridad por si Culqi no ha cargado en el HTML
    if (!window.Culqi) {
      setError('El servicio de Culqi no está disponible en este momento.');
      return;
    }

    setLoading(true);
    try {
      await window.Culqi.yape.generate({ phone, code });
    } catch {
      const msg = 'Error al generar el pago con Yape';
      setError(msg);
      onError?.(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-xl max-w-xs">
      <p className="text-sm text-gray-500">
        Abre tu app Yape → <strong>Código QR o código</strong> → ingresa los datos
      </p>

      <input
        type="tel"
        placeholder="Número de teléfono Yape"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        maxLength={9}
        className="border rounded-lg px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Código de aprobación (6 dígitos)"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
        className="border rounded-lg px-3 py-2 text-sm"
      />

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <button
        type="button"
        onClick={() => void handlePagar()}
        disabled={loading || disabled}
        className="bg-purple-600 text-white py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition font-bold"
      >
        {loading ? 'Procesando...' : `Pagar ${formatearSoles(montoSoles)}`}
      </button>
    </div>
  );
}