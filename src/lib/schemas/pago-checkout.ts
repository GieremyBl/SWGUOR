import { z } from 'zod';
import type { PaymentGatewayId } from '@/lib/services/payments/payment-gateway.types';

export const METODOS_PAGO_CHECKOUT = ['culqi', 'stripe', 'mercadopago'] as const;

export const metodoPagoCheckoutSchema = z.enum(METODOS_PAGO_CHECKOUT);

export type MetodoPagoCheckout = z.infer<typeof metodoPagoCheckoutSchema>;

export const pagoCheckoutAccionSchema = z.enum([
  'intencion',
  'cargo',
  'confirm',
]);

export type PagoCheckoutAccion = z.infer<typeof pagoCheckoutAccionSchema>;

export const pagoCheckoutRequestSchema = z.object({
  metodo_pago: metodoPagoCheckoutSchema,
  accion: pagoCheckoutAccionSchema.optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type PagoCheckoutRequest = z.infer<typeof pagoCheckoutRequestSchema>;

export function resolverAccionCheckout(
  accion: PagoCheckoutAccion | undefined,
  metodoPago: PaymentGatewayId,
): PagoCheckoutAccion {
  if (accion) return accion;

  if (metodoPago === 'stripe') return 'intencion';
  return 'cargo';
}
