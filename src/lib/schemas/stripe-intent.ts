import { z } from 'zod';

const montoField = z
  .union([z.number(), z.string()])
  .transform((v) => Number(v))
  .optional();

export const stripeIntentRequestSchema = z
  .object({
    metodo_pago: z.literal('stripe').optional().default('stripe'),
    pedido_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
    email: z.string().trim().email('Correo del cliente inválido'),
    monto_a_pagar: montoField,
    monto: montoField,
    description: z.string().trim().optional(),
  })
  .refine((data) => Number.isFinite(data.pedido_id) && data.pedido_id > 0, {
    message: 'ID de pedido inválido',
    path: ['pedido_id'],
  })
  .transform((data) => ({
    metodo_pago: 'stripe' as const,
    pedido_id: data.pedido_id,
    email: data.email,
    monto_a_pagar: data.monto_a_pagar ?? data.monto,
    description: data.description,
  }));

export type StripeIntentRequest = z.infer<typeof stripeIntentRequestSchema>;

export interface StripeIntentSuccessResponse {
  success: true;
  data: {
    client_secret: string;
    payment_intent_id: string;
    amount: number;
    amount_stripe: number;
    currency: string;
    publishable_key: string;
    pedido_id: number;
  };
}

export interface StripeIntentErrorResponse {
  success: false;
  message: string;
  code: string;
}
