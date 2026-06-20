import type { DatosPagadorPago } from '@/lib/schemas/datos-pagador-pago';

export interface CheckoutGatewayPanelProps {
  pedidoId: number;
  email: string;
  /** Monto a cobrar hoy (después de cupón). Compartido entre todas las pasarelas. */
  montoSoles: number;
  /** Saldo pendiente del pedido en BD */
  saldoPendiente: number;
  /** Datos del titular de la tarjeta */
  datosPagador: DatosPagadorPago;
  /** Bloquea el envío del pago (p. ej. datos del pagador incompletos). No impide cargar el formulario. */
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}
