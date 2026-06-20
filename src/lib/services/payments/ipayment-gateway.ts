import type {
  CargoProcesadoResult,
  IntencionPagoResult,
  MonedaPago,
  PagoMetadata,
  PaymentGatewayId,
} from '@/lib/services/payments/payment-gateway.types';

/**
 * Contrato estándar para pasarelas de pago (Strategy).
 * Implementaciones: CulqiAdapter, StripeAdapter (futuro), MercadoPagoAdapter (futuro).
 */
export interface IPaymentGateway {
  readonly gatewayId: PaymentGatewayId;

  /**
   * Prepara y valida un cobro antes de tokenizar en el cliente.
   * Debe revalidar montos contra BD cuando `metadata.pedido_id` esté presente.
   */
  crearIntencionPago(
    monto: number,
    moneda: MonedaPago,
    metadata: PagoMetadata,
  ): Promise<IntencionPagoResult>;

  /**
   * Ejecuta el cargo con el token/source generado por la pasarela.
   */
  procesarCargo(
    token: string,
    monto: number,
    moneda: MonedaPago,
    metadata: PagoMetadata,
  ): Promise<CargoProcesadoResult>;
}
